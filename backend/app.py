from flask import Flask
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
    # This allows your specific Vercel URL and local development
    CORS(app, supports_credentials=True, origins=[
        "https://cine-match-zeta.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ])
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize Login Manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)
    
    # Initialize recommendation service
    with app.app_context():
        recommendation_service.init_app(app)
        db.create_all()
    
    # Register Blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    return app

app = create_app()

if __name__ == '__main__':
    # Use environment variable for port if available (Render provides this)
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
