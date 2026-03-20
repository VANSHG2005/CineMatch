import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Ensure SECRET_KEY is consistent to prevent session loss on restart
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key-12345"
    TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
    TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500"
    
    # Render provides postgres:// which SQLAlchemy 1.4+ needs as postgresql://
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL:
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
        # Log sanitized DB info for debugging DNS issues
        try:
            from urllib.parse import urlparse
            parsed = urlparse(DATABASE_URL)
            print(f"DEBUG: Connecting to DB host: {parsed.hostname}")
        except:
            print("DEBUG: DATABASE_URL is set but could not parse hostname")
    else:
        print("DEBUG: DATABASE_URL not set, falling back to SQLite")
    
    # Use absolute path for SQLite (fallback)
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or f'sqlite:///{os.path.join(basedir, "instance", "users.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Engine options for better connection handling on Render/Postgres
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    }

    # Cookie settings for cross-site auth (Vercel frontend + Render backend)
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    # Ensure session persists across browser restarts if desired
    REMEMBER_COOKIE_DURATION = 3600 * 24 * 30  # 30 days
    
    # Model URLs
    MODEL_URLS = {
        "tmdb_movies.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_movies.pkl?download=true",
        "tmdb_similarity.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_similarity.pkl?download=true",
        "tmdb_tv_series.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_tv_shows.pkl?download=true",
        "tmdb_tv_similarity.pkl": "https://huggingface.co/VANSHGARG2005/cinematch-models/resolve/main/tmdb_tv_similarity.pkl?download=true"
    }
