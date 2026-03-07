import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or os.urandom(24)
    TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
    TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500"
    
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or 'sqlite:///instance/users.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Model URLs
    MODEL_URLS = {
        "tmdb_movies.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_movies.pkl?download=true",
        "tmdb_similarity.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_similarity.pkl?download=true",
        "tmdb_tv_series.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_tv_shows.pkl?download=true",
        "tmdb_tv_similarity.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_tv_similarity.pkl?download=true"
    }
