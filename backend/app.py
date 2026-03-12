from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from models.user import db, User
from routes.api_routes import api
from services.recommendation_service import recommendation_service
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Ensure instance folder exists for SQLite (fallback only)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except Exception as e:
        print(f"Error creating instance path: {e}")
    
    # Enhanced CORS Configuration
    CORS(app, 
         supports_credentials=True, 
         origins=[
            "https://cine-match-zeta.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
         ],
         allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize Migrate
    migrate = Migrate(app, db)
    
    # Log database connection info (scrubbed)
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'sqlite' in db_uri:
        print(f"WARNING: Using SQLite database (ephemeral): {db_uri}")
    elif 'postgresql' in db_uri:
        # Scrub password from log
        safe_uri = db_uri.split('@')[-1] if '@' in db_uri else db_uri
        print(f"SUCCESS: Using PostgreSQL database (persistent): {safe_uri}")
    else:
        print("Using unknown database type")
    
    # Initialize Login Manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        # Modern way to get user in SQLAlchemy 3.0+
        return db.session.get(User, user_id)
    
    # Global error logger
    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        import sys
        print("!!! SERVER ERROR DETECTED !!!", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return jsonify({
            "error": "Internal Server Error", 
            "message": str(e),
            "type": e.__class__.__name__
        }), 500
    
    # Health check route
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy", "service": "cinematch-backend"}), 200
    
    # Root route for monitors
    @app.route('/')
    def index():
        return jsonify({"message": "CineMatch API is running", "docs": "/api"}), 200
    
    # Initialize recommendation service
    with app.app_context():
        print("Initializing database and services...")
        try:
            # create_all will only create tables if they don't exist
            # On Render with Postgres, this ensures the schema is ready
            db.create_all()
            recommendation_service.init_app(app)
            print("Initialization successful.")
        except Exception as e:
            print(f"Initialization error: {e}")
    
    # Register Blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
