from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.String(100), primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    profile_pic = db.Column(db.String(200))
    password_hash = db.Column(db.Text)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'profile_pic': self.profile_pic
        }

class WatchlistItem(db.Model):
    __tablename__ = 'watchlist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.Integer, nullable=False)
    item_type = db.Column(db.String(10), nullable=False)  # 'movie' or 'tv'
    title = db.Column(db.String(200), nullable=False)
    poster_path = db.Column(db.String(200))
    added_on = db.Column(db.DateTime, default=datetime.utcnow)
    watched = db.Column(db.Boolean, default=False, nullable=False, server_default='false')
    
    user = db.relationship('User', backref=db.backref('watchlist', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'item_type': self.item_type,
            'title': self.title,
            'poster_path': self.poster_path,
            'added_on': self.added_on.isoformat(),
            'watched': self.watched or False
        }

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.Integer, nullable=False)
    item_type = db.Column(db.String(10), nullable=False) # 'movie' or 'tv'
    text = db.Column(db.Text, nullable=False)
    rating = db.Column(db.SmallInteger, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('comments', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else "Unknown User",
            'user_pic': self.user.profile_pic if self.user else "https://via.placeholder.com/150",
            'item_id': self.item_id,
            'text': self.text,
            'rating': self.rating,
            'created_at': self.created_at.isoformat()
        }

# ── Continue Watching ─────────────────────────────────────────────────────────
class ContinueWatching(db.Model):
    __tablename__ = 'continue_watching'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    show_id    = db.Column(db.Integer, nullable=False)     # TMDB TV show id
    show_name  = db.Column(db.String(200), nullable=False)
    poster_path= db.Column(db.String(200))
    season_number  = db.Column(db.Integer, default=1)
    episode_number = db.Column(db.Integer, default=1)
    episode_name   = db.Column(db.String(200))
    progress   = db.Column(db.Float, default=0)  # 0-100 percent watched
    last_watched = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('continue_watching', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'show_id': self.show_id,
            'show_name': self.show_name,
            'poster_path': self.poster_path,
            'season_number': self.season_number,
            'episode_number': self.episode_number,
            'episode_name': self.episode_name,
            'progress': self.progress,
            'last_watched': self.last_watched.isoformat()
        }

class EpisodeProgress(db.Model):
    __tablename__ = 'episode_progress'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    show_id    = db.Column(db.Integer, nullable=False)
    season_number = db.Column(db.Integer, nullable=False)
    episode_number = db.Column(db.Integer, nullable=False)
    watched    = db.Column(db.Boolean, default=True)
    watched_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('episode_progress', lazy='dynamic'))

    __table_args__ = (db.UniqueConstraint('user_id', 'show_id', 'season_number', 'episode_number', name='_user_episode_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'show_id': self.show_id,
            'season_number': self.season_number,
            'episode_number': self.episode_number,
            'watched': self.watched,
            'watched_at': self.watched_at.isoformat()
        }

# ── Playlists ─────────────────────────────────────────────────────────────────
import secrets as _secrets

# Association table for Followers
follows = db.Table('follows',
    db.Column('follower_id', db.String(100), db.ForeignKey('user.id'), primary_key=True),
    db.Column('followed_id', db.String(100), db.ForeignKey('user.id'), primary_key=True)
)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    type       = db.Column(db.String(50))  # e.g., 'new_follower', 'playlist_shared'
    title      = db.Column(db.String(200))
    body       = db.Column(db.Text)
    link       = db.Column(db.String(200))
    read       = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'link': self.link,
            'read': self.read,
            'created_at': self.created_at.isoformat()
        }

class Playlist(db.Model):
    __tablename__ = 'playlists'

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    name        = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    is_public   = db.Column(db.Boolean, default=False, nullable=False)
    share_id    = db.Column(db.String(16), unique=True, nullable=False,
                            default=lambda: _secrets.token_urlsafe(10))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    user  = db.relationship('User', backref=db.backref('playlists', lazy='dynamic'))
    items = db.relationship('PlaylistItem', backref='playlist', lazy='dynamic',
                            cascade='all, delete-orphan')

    def to_dict(self, include_items=False):
        d = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'share_id': self.share_id,
            'created_at': self.created_at.isoformat(),
            'owner_name': self.user.name if self.user else '',
            'item_count': self.items.count()
        }
        if include_items:
            d['items'] = [i.to_dict() for i in self.items.order_by(PlaylistItem.position)]
        return d


class PlaylistItem(db.Model):
    __tablename__ = 'playlist_items'

    id          = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlists.id'), nullable=False)
    item_id     = db.Column(db.Integer, nullable=False)
    item_type   = db.Column(db.String(10), nullable=False)  # 'movie' or 'tv'
    title       = db.Column(db.String(200), nullable=False)
    poster_path = db.Column(db.String(200))
    position    = db.Column(db.Integer, default=0)
    added_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'item_type': self.item_type,
            'title': self.title,
            'poster_path': self.poster_path,
            'position': self.position
        }