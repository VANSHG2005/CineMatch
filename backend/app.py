from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException
from config import Config
from models.user import db, User
from routes.api_routes import api
from services.recommendation_service import recommendation_service
try:
    from services.notification_service import notification_service
except ImportError:
    notification_service = None
from extensions import mail
import os

def _run_startup_migrations(app):
    """
    Runs lightweight DB migrations on every startup.
    All operations are idempotent — safe to run repeatedly.
    """
    from sqlalchemy import text

    # Step 1: Create all tables defined in models if they don't exist yet.
    # This handles a brand-new empty database (e.g. fresh Render PostgreSQL instance).
    print("Ensuring all model tables exist...")
    try:
        db.create_all()
        print("[migration] db.create_all() complete.")
    except Exception as e:
        print(f"[migration] db.create_all() error: {e}")

    print("Running startup DB migrations...")

    # Fix 1: Ensure password_hash column is TEXT (was VARCHAR(128), too short for bcrypt)
    try:
        db.session.execute(text('ALTER TABLE "user" ALTER COLUMN password_hash TYPE TEXT;'))
        db.session.commit()
        print("[migration] password_hash column set to TEXT.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] password_hash already OK or skipped: {e}")

    # Fix 2: Create comments table if it doesn't exist
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS comments (
                id         SERIAL PRIMARY KEY,
                user_id    VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                item_id    INTEGER NOT NULL,
                item_type  VARCHAR(10) NOT NULL,
                text       TEXT NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))
        db.session.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_comments_item
            ON comments (item_id, item_type);
        """))
        db.session.commit()
        print("[migration] comments table ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] comments table error: {e}")

    # Fix 3: Add rating column to comments (Feature 5 — star ratings)
    try:
        db.session.execute(text('ALTER TABLE comments ADD COLUMN IF NOT EXISTS rating SMALLINT;'))
        db.session.commit()
        print("[migration] comments.rating column ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] comments.rating skipped: {e}")

    # Fix 4: Add watched column to watchlist_items
    try:
        db.session.execute(text('ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS watched BOOLEAN NOT NULL DEFAULT FALSE;'))
        db.session.commit()
        print("[migration] watchlist_items.watched column ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] watchlist_items.watched skipped: {e}")

    # Fix 5: Add edited_at column to comments
    try:
        db.session.execute(text('ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITHOUT TIME ZONE;'))
        db.session.commit()
        print("[migration] comments.edited_at column ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] comments.edited_at skipped: {e}")

    # Fix 6: follows table (friend system)
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS follows (
                follower_id VARCHAR(100) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                followed_id VARCHAR(100) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (follower_id, followed_id)
            );
        """))
        db.session.commit()
        print("[migration] follows table ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] follows table skipped: {e}")

    # Fix 7: notifications table
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id         SERIAL PRIMARY KEY,
                user_id    VARCHAR(100) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                type       VARCHAR(30) NOT NULL,
                title      VARCHAR(200) NOT NULL,
                body       TEXT NOT NULL,
                link       VARCHAR(300),
                read       BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))
        db.session.execute(text('CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications (user_id, read);'))
        db.session.commit()
        print("[migration] notifications table ready.")
    except Exception as e:
        db.session.rollback()
        print(f"[migration] notifications table skipped: {e}")

    print("Startup migrations complete.")


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Just making sure the instance folder exists so SQLite doesn't crash on me
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except Exception as e:
        print(f"Had some trouble creating the instance path: {e}")
    
    # Setup CORS - needed for Vercel/Render communication
    # Make sure to include both localhost and the production URL
    CORS(app, 
         supports_credentials=True, 
         origins=[
            "https://cine-match-zeta.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
         ],
         allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    
    # Fire up the DB and Migrations
    db.init_app(app)
    mail.init_app(app)
    migrate = Migrate(app, db)

    # Run DB migrations right after db is bound — creates missing tables and fixes column types.
    # Safe to run on every deploy (all ops are idempotent).
    with app.app_context():
        _run_startup_migrations(app)
    
    # Just a small check to see which DB we're actually hitting (dev vs prod)
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'sqlite' in db_uri:
        print(f"NOTE: Using SQLite for local dev: {db_uri}")
    elif 'postgresql' in db_uri:
        # Don't want to log the full URL with password, so just the end
        safe_uri = db_uri.split('@')[-1] if '@' in db_uri else db_uri
        print(f"SUCCESS: Connected to PostgreSQL (Production): {safe_uri}")
    
    # Flask-Login setup
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        # Using db.session.get because it's the newer way in SQLAlchemy
        return db.session.get(User, user_id)
    
    # Custom error handler so the frontend doesn't just get a blank 500
    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        import sys
        
        # If it's already an HTTP error (like 404), let it be
        if isinstance(e, HTTPException):
            return jsonify({
                "error": e.name, 
                "message": e.description,
                "type": e.__class__.__name__
            }), e.code

        print("--- DEBUG: SERVER ERROR ---", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            "error": "Something went wrong on the server", 
            "message": str(e),
            "type": e.__class__.__name__
        }), 500
    
    # Simple routes for checking if the server is alive
    @app.route('/health')
    def health():
        return jsonify({"status": "all good", "version": "1.0.1"}), 200
    
    @app.route('/')
    def index():
        return jsonify({"message": "CineMatch API is live"}), 200
    
    # Initializing the ML recommendation engine here
    with app.app_context():
        print("Starting up the recommendation engine...")
        try:
            # We use lazy loading inside here to save memory on start
            recommendation_service.init_app(app)
            print("Backend logic is fully loaded.")
        except Exception as e:
            print(f"Error during startup: {e}")
    
    # All our main API logic is inside this blueprint
    # We register without prefix because the frontend expects routes at root
    app.register_blueprint(api)
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)