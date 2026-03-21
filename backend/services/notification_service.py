"""
services/notification_service.py

Background thread that runs every 6 hours and checks TMDB for:
  - New seasons on TV shows in users' watchlists
  - Saves a Notification row for each user that has that show saved

Starts automatically when the Flask app boots via init_app().
"""
import threading
import time
import requests as req
from datetime import datetime, timedelta
from flask import current_app

CHECK_INTERVAL = 6 * 60 * 60  # 6 hours in seconds


class NotificationService:
    def __init__(self):
        self._thread = None
        self._stop = threading.Event()
        self._app = None

    def init_app(self, app):
        self._app = app
        # Only start the background thread in production (not during migrations etc.)
        if app.config.get('ENABLE_NOTIFICATIONS', True):
            self._start()

    def _start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True, name='NotifChecker')
        self._thread.start()
        print("[notifications] Background checker started (interval=6h)")

    def _loop(self):
        # Wait 2 min on first boot so the app is fully up before hitting TMDB
        time.sleep(120)
        while not self._stop.is_set():
            try:
                with self._app.app_context():
                    self._check_new_seasons()
            except Exception as e:
                print(f"[notifications] Checker error: {e}")
            self._stop.wait(CHECK_INTERVAL)

    def _check_new_seasons(self):
        from models.user import db, WatchlistItem, Notification

        api_key = self._app.config.get('TMDB_API_KEY')
        if not api_key:
            return

        # Get all unique TV show IDs from watchlists
        tv_items = WatchlistItem.query.filter_by(item_type='tv').all()
        if not tv_items:
            return

        # Group by item_id so we only call TMDB once per unique show
        shows = {}
        for item in tv_items:
            shows.setdefault(item.item_id, []).append(item.user_id)

        cutoff = datetime.utcnow() - timedelta(days=7)  # only alert for seasons in last 7 days

        for show_id, user_ids in shows.items():
            try:
                url = f"https://api.themoviedb.org/3/tv/{show_id}?api_key={api_key}&language=en-US"
                resp = req.get(url, timeout=5)
                if resp.status_code != 200:
                    continue
                data = resp.json()
                seasons = data.get('seasons', [])
                name = data.get('name', 'A show')

                for season in seasons:
                    air_date_str = season.get('air_date')
                    if not air_date_str:
                        continue
                    try:
                        air_date = datetime.strptime(air_date_str, '%Y-%m-%d')
                    except ValueError:
                        continue

                    # Only notify for seasons that aired in the past 7 days
                    if not (cutoff <= air_date <= datetime.utcnow()):
                        continue

                    season_num = season.get('season_number', 0)
                    if season_num == 0:
                        continue  # skip specials

                    notif_key = f"new_season_{show_id}_{season_num}"

                    for user_id in set(user_ids):
                        # Avoid duplicate notifications
                        exists = Notification.query.filter_by(
                            user_id=user_id, type='new_season', link=f'/tv/{show_id}'
                        ).filter(Notification.body.contains(f'Season {season_num}')).first()

                        if not exists:
                            notif = Notification(
                                user_id=user_id,
                                type='new_season',
                                title=f'New season of {name}!',
                                body=f'Season {season_num} of {name} is now available.',
                                link=f'/tv/{show_id}'
                            )
                            db.session.add(notif)

                db.session.commit()
            except Exception as e:
                db.session.rollback()
                print(f"[notifications] Error checking show {show_id}: {e}")

    def stop(self):
        self._stop.set()


notification_service = NotificationService()