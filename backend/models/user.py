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
    edited_at = db.Column(db.DateTime, nullable=True)
    
    user = db.relationship('User', backref=db.backref('comments', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else "Unknown User",
            'user_pic': self.user.profile_pic if self.user else "https://via.placeholder.com/150",
            'item_id': self.item_id,
            'item_type': self.item_type,
            'text': self.text,
            'rating': self.rating,
            'created_at': self.created_at.isoformat(),
            'edited_at': self.edited_at.isoformat() if self.edited_at else None
        }

# ── Follow relationship (Feature 3: Friends) ──────────────────────────────────
follows = db.Table('follows',
    db.Column('follower_id', db.String(100), db.ForeignKey('user.id'), primary_key=True),
    db.Column('followed_id', db.String(100), db.ForeignKey('user.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(300))
    read = db.Column(db.Boolean, default=False, nullable=False)
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
        }git add backend/models/user.py