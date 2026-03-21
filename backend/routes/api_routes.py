from flask import Blueprint, jsonify, request, session, current_app
from flask_login import login_user, logout_user, current_user, login_required
from models.user import User, WatchlistItem, Comment, db
from services.tmdb_service import TMDBService
from services.recommendation_service import recommendation_service
from utils.genres import get_genres_dict
import uuid

api = Blueprint('api', __name__)

@api.route('/genres', methods=['GET'])
def get_genres():
    return jsonify(get_genres_dict())

@api.route('/genre/<content_type>/<int:genre_id>', methods=['GET'])
def get_genre_content(content_type, genre_id):
    genres_dict = get_genres_dict()
    
    if content_type == 'movie':
        genre_info = genres_dict['movies'].get(genre_id)
        genre_name = genre_info['name'] if genre_info else None
        tv_genre_ids = genre_info['tv_match'] if genre_info else []
    elif content_type == 'tv':
        genre_info = genres_dict['tv'].get(genre_id)
        genre_name = genre_info['name'] if genre_info else None
        movie_genre_ids = genre_info['movie_match'] if genre_info else []
    else:
        return jsonify({'error': 'Invalid content type'}), 400
    
    if not genre_name:
        return jsonify({'error': 'Genre not found'}), 404
    
    movies = []
    tv_shows = []
    
    if content_type == 'movie':
        movies = TMDBService.fetch_movies_by_category("popular", genre_id=genre_id)
        for tv_genre_id in tv_genre_ids:
            shows = TMDBService.fetch_tv_by_category("popular", genre_id=tv_genre_id)
            tv_shows.extend(shows)
    else:
        tv_shows = TMDBService.fetch_tv_by_category("popular", genre_id=genre_id)
        for movie_genre_id in movie_genre_ids:
            films = TMDBService.fetch_movies_by_category("popular", genre_id=movie_genre_id)
            movies.extend(films)
    
    # Deduplicate
    movies = list({v['id']:v for v in movies}.values())
    tv_shows = list({v['id']:v for v in tv_shows}.values())
    
    return jsonify({
        'genre_name': genre_name,
        'movies': movies[:20],
        'tv_shows': tv_shows[:20]
    })

@api.route('/init-data', methods=['GET'])
def init_data():
    trending_movies = TMDBService.fetch_trending('movie')
    trending_tv = TMDBService.fetch_trending('tv')
    indian_movies = TMDBService.fetch_indian_content('movie')
    return jsonify({
        'trending_movies': trending_movies,
        'trending_tv': trending_tv,
        'indian_movies': indian_movies
    })

@api.route('/movies/<category>', methods=['GET'])
def get_movies_category(category):
    movies = TMDBService.fetch_movies_by_category(category)
    return jsonify(movies)

@api.route('/tv/<category>', methods=['GET'])
def get_tv_category(category):
    tv_shows = TMDBService.fetch_tv_by_category(category)
    return jsonify(tv_shows)

@api.route('/movie/<int:movie_id>', methods=['GET'])
def get_movie_detail(movie_id):
    movie_details = TMDBService.get_movie_details(movie_id)
    if not movie_details:
        return jsonify({'error': 'Movie not found'}), 404
    
    # Extract cast and crew
    credits = movie_details.get('credits', {})
    cast = credits.get('cast', [])[:10]
    crew = [m for m in credits.get('crew', []) if m.get('job') in ['Director', 'Screenplay', 'Writer', 'Producer']]
    
    # Extract trailer
    trailer_key = None
    videos = movie_details.get('videos', {}).get('results', [])
    for video in videos:
        if video.get('site') == 'YouTube' and video.get('type') == 'Trailer':
            trailer_key = video.get('key')
            break
            
    # Extract providers
    all_providers = movie_details.get('watch/providers', {}).get('results', {})
    providers = all_providers.get('IN') # Default to India
    if not providers:
        # Fallback to US if India not available, or just get any available
        providers = all_providers.get('US')
    if not providers and all_providers:
        # If still no luck, grab the first available region
        first_region = next(iter(all_providers))
        providers = all_providers.get(first_region)
    
    # Extract API similar movies
    api_similar = movie_details.get('similar', {}).get('results', [])[:12]

    # Extract related movies (franchise)
    related_movies = []
    collection = movie_details.get("belongs_to_collection")
    if collection:
        try:
            collection_id = collection["id"]
            from services.tmdb_service import requests as tmdb_requests
            api_key = TMDBService.get_api_key()
            coll_url = f"https://api.themoviedb.org/3/collection/{collection_id}?api_key={api_key}&language=en-US"
            # Set a strict timeout for the sub-request
            coll_response = tmdb_requests.get(coll_url, timeout=3)
            if coll_response.status_code == 200:
                related_movies = [m for m in coll_response.json().get("parts", []) if m["id"] != movie_id]
        except Exception as e:
            print(f"Error fetching collection {collection_id}: {e}")
            related_movies = []

    # ML recommendations
    ml_recommendations = []
    if movie_details.get('title'):
        _, ml_recommendations = recommendation_service.get_movie_recommendations(movie_details['title'])
    
    # Check if in watchlist
    in_watchlist = False
    if current_user.is_authenticated:
        item = WatchlistItem.query.filter_by(user_id=current_user.id, item_id=movie_id, item_type='movie').first()
        if item:
            in_watchlist = True
            
    # Clean up details
    movie_details.pop('credits', None)
    movie_details.pop('videos', None)
    movie_details.pop('watch/providers', None)
    movie_details.pop('similar', None)

    # Convert genres to list of names
    movie_details['genres'] = [g['name'] for g in movie_details.get('genres', [])]

    return jsonify({
        'details': movie_details,
        'cast': cast,
        'crew': crew,
        'trailer_key': trailer_key,
        'streaming_providers': providers,
        'api_similar': api_similar,
        'related_movies': related_movies,
        'ml_recommendations': ml_recommendations[:12],
        'in_watchlist': in_watchlist
    })

@api.route('/tv/<int:tv_id>', methods=['GET'])
def get_tv_detail(tv_id):
    tv_details = TMDBService.get_tv_details(tv_id)
    if not tv_details:
        return jsonify({'error': 'TV show not found'}), 404
    
    # Extract cast and crew
    credits = tv_details.get('credits', {})
    cast = credits.get('cast', [])[:10]
    crew = [m for m in credits.get('crew', []) if m.get('job') in ['Director', 'Screenplay', 'Writer', 'Producer']]
    
    # Extract trailer
    trailer_key = None
    videos = tv_details.get('videos', {}).get('results', [])
    for video in videos:
        if video.get('site') == 'YouTube' and video.get('type') == 'Trailer':
            trailer_key = video.get('key')
            break
            
    # Extract providers
    providers = tv_details.get('watch/providers', {}).get('results', {}).get('IN')
    if not providers:
        providers = tv_details.get('watch/providers', {}).get('results', {}).get('US')
    
    # Extract API similar
    api_similar = tv_details.get('similar', {}).get('results', [])[:12]

    # ML recommendations
    ml_recommendations = []
    if tv_details.get('name'):
        _, ml_recommendations = recommendation_service.get_tv_recommendations(tv_details['name'])
    
    # Check if in watchlist
    in_watchlist = False
    if current_user.is_authenticated:
        item = WatchlistItem.query.filter_by(user_id=current_user.id, item_id=tv_id, item_type='tv').first()
        if item:
            in_watchlist = True

    # Clean up details
    tv_details.pop('credits', None)
    tv_details.pop('videos', None)
    tv_details.pop('watch/providers', None)
    tv_details.pop('similar', None)

    # Convert genres to list of names
    tv_details['genres'] = [g['name'] for g in tv_details.get('genres', [])]
    
    return jsonify({
        'details': tv_details,
        'cast': cast,
        'crew': crew,
        'trailer_key': trailer_key,
        'streaming_providers': providers,
        'api_similar': api_similar,
        'ml_recommendations': ml_recommendations[:12],
        'in_watchlist': in_watchlist
    })

@api.route('/person/<int:person_id>', methods=['GET'])
def get_person_detail(person_id):
    person_details = TMDBService.get_person_details(person_id)
    if not person_details:
        return jsonify({'error': 'Person not found'}), 404
    
    # Extract combined credits
    all_credits = person_details.get('combined_credits', {}).get('cast', [])
    
    # 1. Get unique 'known_for' works (top 8 most popular)
    seen_ids = set()
    unique_known_for = []
    sorted_by_pop = sorted(all_credits, key=lambda x: x.get('popularity', 0), reverse=True)
    
    for credit in sorted_by_pop:
        item_id = credit.get('id')
        if item_id not in seen_ids:
            seen_ids.add(item_id)
            unique_known_for.append(credit)
        if len(unique_known_for) >= 8:
            break
            
    # Clean up response
    credits = person_details.pop('combined_credits', {})
    
    return jsonify({
        'details': person_details,
        'credits': credits,
        'known_for': unique_known_for
    })

@api.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    movies = TMDBService.search(query, 'movie')
    tv_shows = TMDBService.search(query, 'tv')
    return jsonify({
        'movies': movies[:12],
        'tv_shows': tv_shows[:12]
    })

@api.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    name = data.get('name', '').strip()
    content_type = data.get('content_type', 'movie').strip().lower()
    
    if not name:
        return jsonify({'error': 'No name provided'}), 400
    
    if content_type == 'movie':
        searched_item, recs = recommendation_service.get_movie_recommendations(name)
    else:
        searched_item, recs = recommendation_service.get_tv_recommendations(name)
        
    if not searched_item:
        return jsonify({'error': 'Not found'}), 404
        
    return jsonify({
        'searched_item': searched_item,
        'recommendations': recs
    })

# Auth Routes
@api.route('/auth/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        print(f"Signup blocked: {email} already exists.")
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        profile_pic='https://via.placeholder.com/150'
    )
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        print(f"New user registered: {email}")
    except Exception as e:
        db.session.rollback()
        print(f"Signup error for {email}: {e}")
        return jsonify({'error': 'Could not create account. Please try again.'}), 500
    
    login_user(user)
    return jsonify({'user': user.to_dict()})

@api.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if user:
        if user.check_password(password):
            login_user(user)
            print(f"User logged in: {email}")
            return jsonify({'user': user.to_dict()})
        else:
            print(f"Login failed: Incorrect password for {email}")
    else:
        print(f"Login failed: User not found: {email}")
    
    return jsonify({'error': 'Invalid credentials'}), 401

@api.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out'})

@api.route('/auth/me', methods=['GET'])
def me():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict()})
    return jsonify({'user': None})

@api.route('/auth/update', methods=['PUT'])
@login_required
def update_profile():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    
    if email:
        email = email.strip().lower()
        if email != current_user.email:
            existing = User.query.filter_by(email=email).first()
            if existing:
                return jsonify({'error': 'Email already in use'}), 400
            current_user.email = email
        
    if name:
        current_user.name = name
        
    db.session.commit()
    return jsonify({'user': current_user.to_dict(), 'message': 'Profile updated successfully'})


@api.route('/auth/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.json
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')

    if not current_user.check_password(current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 400
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    current_user.set_password(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'})


@api.route('/watchlist/clear', methods=['DELETE'])
@login_required
def clear_watchlist():
    WatchlistItem.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'message': 'Watchlist cleared'})


@api.route('/auth/delete-account', methods=['DELETE'])
@login_required
def delete_account():
    from flask_login import logout_user
    from sqlalchemy import text
    user_id = current_user.id

    # Log out BEFORE expunging so Flask-Login clears the session cookie
    logout_user()

    try:
        # Expunge all ORM-tracked objects so SQLAlchemy doesn't try to
        # cascade nullify related rows when we commit raw SQL deletes
        db.session.expunge_all()

        # Delete in FK-safe order using raw SQL — bypasses ORM cascade issues
        db.session.execute(text('DELETE FROM comments WHERE user_id = :uid'), {'uid': user_id})
        db.session.execute(text('DELETE FROM watchlist_items WHERE user_id = :uid'), {'uid': user_id})
        db.session.execute(text('DELETE FROM notifications WHERE user_id = :uid'), {'uid': user_id})
        db.session.execute(text('DELETE FROM follows WHERE follower_id = :uid OR followed_id = :uid'), {'uid': user_id})
        db.session.execute(text('DELETE FROM "user" WHERE id = :uid'), {'uid': user_id})
        db.session.commit()
        return jsonify({'message': 'Account deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Delete account error: {e}")
        return jsonify({'error': 'Failed to delete account. Please try again.'}), 500

# Watchlist Routes
@api.route('/watchlist', methods=['GET'])
@login_required
def get_watchlist():
    items = WatchlistItem.query.filter_by(user_id=current_user.id).order_by(WatchlistItem.added_on.desc()).all()
    return jsonify([item.to_dict() for item in items])

@api.route('/watchlist/add', methods=['POST'])
@login_required
def add_to_watchlist():
    data = request.json
    existing = WatchlistItem.query.filter_by(
        user_id=current_user.id,
        item_id=data['item_id'],
        item_type=data['item_type']
    ).first()
    
    if existing:
        return jsonify({'error': 'Already in watchlist'}), 400
    
    new_item = WatchlistItem(
        user_id=current_user.id,
        item_id=data['item_id'],
        item_type=data['item_type'],
        title=data['title'],
        poster_path=data['poster_path']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict())

@api.route('/watchlist/remove/<int:item_id>', methods=['DELETE'])
@login_required
def remove_from_watchlist(item_id):
    item = WatchlistItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Removed'})
    return jsonify({'error': 'Not found'}), 404

@api.route('/watchlist/remove_toggle/<int:item_id>/<item_type>', methods=['DELETE'])
@login_required
def remove_watchlist_toggle(item_id, item_type):
    item = WatchlistItem.query.filter_by(
        user_id=current_user.id, 
        item_id=item_id, 
        item_type=item_type
    ).first()
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Removed from watchlist'})
    return jsonify({'error': 'Item not found in watchlist'}), 404

# Comment Routes
# GET /comments/my-activity — returns all comments+ratings made by the logged-in user
# Includes item title fetched from TMDB so the profile can display it
@api.route("/comments/my-activity", methods=["GET"])
@login_required
def get_my_activity():
    try:
        comments = Comment.query.filter_by(user_id=current_user.id).order_by(Comment.created_at.desc()).all()
        result = []
        for c in comments:
            d = c.to_dict()
            # Ensure item_id is always present (used by frontend to build the link)
            d['item_id'] = c.item_id
            d['item_type'] = c.item_type
            # Fetch title from TMDB
            try:
                if c.item_type == 'movie':
                    details = TMDBService.get_movie_details(c.item_id)
                    d['item_title'] = details.get('title') if details else f'Movie #{c.item_id}'
                else:
                    details = TMDBService.get_tv_details(c.item_id)
                    d['item_title'] = details.get('name') if details else f'Show #{c.item_id}'
            except Exception:
                d['item_title'] = f'{"Movie" if c.item_type == "movie" else "Show"} #{c.item_id}'
            result.append(d)
        return jsonify(result)
    except Exception as e:
        print(f"Failed to fetch user activity: {e}")
        return jsonify([])

@api.route("/comments/<int:item_id>/<item_type>", methods=["GET"])
def get_comments(item_id, item_type):
    try:
        comments = Comment.query.filter_by(item_id=item_id, item_type=item_type).order_by(Comment.created_at.desc()).all()
        return jsonify([c.to_dict() for c in comments])
    except Exception as e:
        # Gracefully handle the case where the comments table doesn't exist yet.
        # Run create_comments_table.py on the server to permanently fix this.
        print(f"Comments table error (run create_comments_table.py to fix): {e}")
        return jsonify([])

@api.route("/comments/<int:comment_id>", methods=["PUT"])
@login_required
def edit_comment(comment_id):
    comment = db.session.get(Comment, comment_id)
    if not comment:
        return jsonify({"error": "Comment not found"}), 404
    if comment.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Comment text is required"}), 400
    comment.text = data["text"].strip()
    rating = data.get("rating")
    if rating is not None:
        rating = int(rating)
        comment.rating = rating if 1 <= rating <= 5 else None
    else:
        comment.rating = None
    # Track edit time
    from datetime import datetime
    comment.edited_at = datetime.utcnow()
    db.session.commit()
    return jsonify(comment.to_dict())

@api.route("/comments/<int:comment_id>", methods=["DELETE"])
@login_required
def delete_comment(comment_id):
    # Use db.session.get() — Query.get() is deprecated in SQLAlchemy 2.0
    comment = db.session.get(Comment, comment_id)
    if not comment:
        return jsonify({"error": "Comment not found"}), 404
    if comment.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"})

import random, string

# --- Feature 5: POST /comments with star rating support ---

@api.route("/comments", methods=["POST"])
@login_required
def post_comment():
    data = request.json
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Comment text is required"}), 400
    try:
        rating = data.get("rating")
        if rating is not None:
            rating = int(rating)
            if not (1 <= rating <= 5):
                rating = None
        comment = Comment(
            user_id=current_user.id,
            item_id=data["item_id"],
            item_type=data["item_type"],
            text=data["text"].strip(),
            rating=rating
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify(comment.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"Failed to post comment: {e}")
        return jsonify({"error": "Could not save comment."}), 500


# --- Feature 6: PATCH /watchlist/<id>/watched — mark as watched/unwatched ---
@api.route('/watchlist/<int:item_id>/watched', methods=['PATCH'])
@login_required
def toggle_watched(item_id):
    item = WatchlistItem.query.filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    data = request.json
    item.watched = bool(data.get('watched', False))
    db.session.commit()
    return jsonify(item.to_dict())


# --- Feature 8: OTP email verification ---

import os
# mail/smtp imported inside send_otp() to avoid circular import
import datetime

# In-memory OTP store: { email: { otp, expires, name } }
_otp_store = {}

@api.route('/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    if not email:
        return jsonify({'error': 'Email required'}), 400

    from models.user import User
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    code = ''.join(random.choices(string.digits, k=6))
    _otp_store[email] = {
        'otp': code,
        'name': name,
        'expires': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    }

    mail_sent = False

    # Try Resend API first (most reliable, free tier = 3000 emails/month)
    resend_api_key = current_app.config.get('RESEND_API_KEY') or os.environ.get('RESEND_API_KEY')
    if resend_api_key:
        try:
            import requests as http_requests
            resp = http_requests.post(
                'https://api.resend.com/emails',
                headers={
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'from': 'CineMatch <onboarding@resend.dev>',
                    'to': [email],
                    'subject': 'Your CineMatch verification code',
                    'html': f"""
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;
                                background:#141414;color:#fff;border-radius:12px;
                                padding:32px;border:1px solid #333;">
                      <h2 style="color:#e50914;margin:0 0 8px;">CineMatch</h2>
                      <p style="color:#aaa;margin:0 0 24px;">Hi {name}, your verification code is:</p>
                      <div style="font-size:2.5rem;font-weight:800;letter-spacing:12px;
                                  text-align:center;background:#1a1a1a;border-radius:8px;
                                  padding:20px;margin-bottom:24px;color:#fff;
                                  border:1px solid #333;">{code}</div>
                      <p style="color:#666;font-size:0.85rem;">Expires in 10 minutes.</p>
                    </div>
                    """
                },
                timeout=10
            )
            if resp.status_code in (200, 201):
                mail_sent = True
                print(f"[OTP] Sent via Resend to {email}")
            else:
                print(f"[OTP] Resend failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"[OTP] Resend error: {e}")

    # Fallback: Gmail SMTP via Flask-Mail
    if not mail_sent:
        try:
            username = current_app.config.get('MAIL_USERNAME')
            password = current_app.config.get('MAIL_PASSWORD')
            if not username or not password:
                raise ValueError("Mail credentials not configured")

            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Your CineMatch verification code'
            msg['From'] = f'CineMatch <{username}>'
            msg['To'] = email
            html_body = f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;
                        background:#141414;color:#fff;border-radius:12px;
                        padding:32px;border:1px solid #333;">
              <h2 style="color:#e50914;margin:0 0 8px;">CineMatch</h2>
              <p style="color:#aaa;margin:0 0 24px;">Hi {name}, your verification code is:</p>
              <div style="font-size:2.5rem;font-weight:800;letter-spacing:12px;
                          text-align:center;background:#1a1a1a;border-radius:8px;
                          padding:20px;margin-bottom:24px;color:#fff;
                          border:1px solid #333;">{code}</div>
              <p style="color:#666;font-size:0.85rem;">Expires in 10 minutes.</p>
            </div>
            """
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.ehlo()
                server.starttls()
                server.login(username, password)
                server.sendmail(username, email, msg.as_string())

            mail_sent = True
            print(f"[OTP] Sent via Gmail SMTP to {email}")
        except Exception as e:
            print(f"[OTP] Gmail SMTP failed: {e}")

    # Always log OTP for debugging
    print(f"[DEV OTP] {email} → {code} (mail_sent={mail_sent})")

    if not mail_sent:
        # Still store the OTP and return success — frontend fallback will handle it
        return jsonify({'message': 'OTP generated', 'mail_sent': False}), 200

    return jsonify({'message': 'OTP sent', 'mail_sent': True}), 200


@api.route('/auth/verify-otp', methods=['POST'])
def verify_otp_signup():
    import uuid
    data = request.json
    email = (data.get('email') or '').strip().lower()
    otp_input = (data.get('otp') or '').strip()
    name = (data.get('name') or '').strip()
    password = data.get('password', '')

    record = _otp_store.get(email)
    if not record:
        return jsonify({'error': 'No OTP found for this email. Please request a new one.'}), 400
    if datetime.datetime.utcnow() > record['expires']:
        _otp_store.pop(email, None)
        return jsonify({'error': 'Code expired. Please request a new one.'}), 400
    if record['otp'] != otp_input:
        return jsonify({'error': 'Incorrect code. Please try again.'}), 400

    # OTP valid — create the account
    _otp_store.pop(email, None)
    from models.user import User
    from flask_login import login_user
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    user = User(id=str(uuid.uuid4()), name=name, email=email, profile_pic='https://via.placeholder.com/150')
    user.set_password(password)
    try:
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return jsonify({'user': user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Could not create account.'}), 500

# ══════════════════════════════════════════════════════════════════════
# NOTIFICATIONS ROUTES
# ══════════════════════════════════════════════════════════════════════

from models.user import Notification

@api.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        notifs = Notification.query.filter_by(user_id=current_user.id)\
            .order_by(Notification.created_at.desc()).limit(30).all()
        unread = Notification.query.filter_by(user_id=current_user.id, read=False).count()
        return jsonify({
            'notifications': [n.to_dict() for n in notifs],
            'unread_count': unread
        })
    except Exception as e:
        print(f"Notifications error: {e}")
        return jsonify({'notifications': [], 'unread_count': 0})

@api.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_read():
    Notification.query.filter_by(user_id=current_user.id, read=False)\
        .update({'read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})

@api.route('/notifications/<int:notif_id>/read', methods=['PATCH'])
@login_required
def mark_read(notif_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user.id).first()
    if not notif:
        return jsonify({'error': 'Not found'}), 404
    notif.read = True
    db.session.commit()
    return jsonify(notif.to_dict())


# ══════════════════════════════════════════════════════════════════════
# FRIENDS / FOLLOWS ROUTES
# ══════════════════════════════════════════════════════════════════════

from models.user import follows
from sqlalchemy import and_

@api.route('/users/search', methods=['GET'])
@login_required
def search_users():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    results = User.query.filter(
        (User.name.ilike(f'%{q}%') | User.email.ilike(f'%{q}%')),
        User.id != current_user.id
    ).limit(10).all()
    # Get IDs the current user follows
    following_rows = db.session.execute(
        follows.select().where(follows.c.follower_id == current_user.id)
    ).fetchall()
    following_ids = {r.followed_id for r in following_rows}
    return jsonify([{**u.to_dict(), 'is_following': u.id in following_ids} for u in results])

@api.route('/users/<user_id>/follow', methods=['POST'])
@login_required
def follow_user(user_id):
    target = db.session.get(User, user_id)
    if not target or target.id == current_user.id:
        return jsonify({'error': 'Invalid user'}), 400
    # Check already following
    existing = db.session.execute(
        follows.select().where(and_(
            follows.c.follower_id == current_user.id,
            follows.c.followed_id == user_id
        ))
    ).first()
    if existing:
        return jsonify({'error': 'Already following'}), 400
    db.session.execute(follows.insert().values(
        follower_id=current_user.id, followed_id=user_id
    ))
    # Notify the followed user
    try:
        notif = Notification(
            user_id=target.id, type='new_follower',
            title=f'{current_user.name} started following you!',
            body=f'{current_user.name} is now following you on CineMatch.',
            link='/friends'
        )
        db.session.add(notif)
    except Exception:
        pass
    db.session.commit()
    return jsonify({'message': f'Now following {target.name}'})

@api.route('/users/<user_id>/unfollow', methods=['DELETE'])
@login_required
def unfollow_user(user_id):
    db.session.execute(
        follows.delete().where(and_(
            follows.c.follower_id == current_user.id,
            follows.c.followed_id == user_id
        ))
    )
    db.session.commit()
    return jsonify({'message': 'Unfollowed'})

@api.route('/friends', methods=['GET'])
@login_required
def get_friends():
    following_rows = db.session.execute(
        follows.select().where(follows.c.follower_id == current_user.id)
    ).fetchall()
    follower_rows = db.session.execute(
        follows.select().where(follows.c.followed_id == current_user.id)
    ).fetchall()
    following_ids = {r.followed_id for r in following_rows}
    follower_ids = {r.follower_id for r in follower_rows}
    following_users = User.query.filter(User.id.in_(following_ids)).all()
    follower_users = User.query.filter(User.id.in_(follower_ids)).all()
    return jsonify({
        'following': [{**u.to_dict(), 'is_following': True} for u in following_users],
        'followers': [{**u.to_dict(), 'is_following': u.id in following_ids} for u in follower_users]
    })

@api.route('/friends/<user_id>/watchlist', methods=['GET'])
@login_required
def friend_watchlist(user_id):
    target = db.session.get(User, user_id)
    if not target:
        return jsonify({'error': 'User not found'}), 404
    # Must be mutual follows
    i_follow = db.session.execute(follows.select().where(and_(
        follows.c.follower_id == current_user.id, follows.c.followed_id == user_id
    ))).first()
    they_follow = db.session.execute(follows.select().where(and_(
        follows.c.follower_id == user_id, follows.c.followed_id == current_user.id
    ))).first()
    if not (i_follow and they_follow):
        return jsonify({'error': 'You can only view watchlists of mutual friends'}), 403
    items = WatchlistItem.query.filter_by(user_id=user_id).order_by(WatchlistItem.added_on.desc()).all()
    return jsonify({'user': target.to_dict(), 'watchlist': [i.to_dict() for i in items]})