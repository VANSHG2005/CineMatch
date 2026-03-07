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
    
    # Enable CORS
    CORS(app, supports_credentials=True)
    
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
    app.run(debug=True, port=5000)
