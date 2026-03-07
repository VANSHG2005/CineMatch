from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
from models.user import db, User
from routes.api_routes import api
from services.recommendation_service import recommendation_service
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enhanced CORS Configuration
    # Using a more permissive setup for production troubleshooting
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
    
    # Initialize Login Manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)
    
    # Global error logger
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Server Error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    
    # Health check route
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy", "service": "cinematch-backend"}), 200
    
    # Initialize recommendation service
    with app.app_context():
        print("Initializing database and services...")
        try:
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
