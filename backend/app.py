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
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Fire up the DB and Migrations
    db.init_app(app)
    migrate = Migrate(app, db)
    
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
        return jsonify({"message": "CineMatch API is live", "endpoints": "/api"}), 200
    
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
    app.register_blueprint(api, url_prefix='/api')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
