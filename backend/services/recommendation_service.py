import joblib
import os
import requests
from rapidfuzz import process
from flask import current_app


class RecommendationService:
    def __init__(self, app=None):
        self.movie_df = None
        self.movie_similarity = None  # now a dict {index: [(idx, score),...]}
        self.tv_df = None
        self.tv_similarity = None
        self.app = None
        self.model_dir = None
        self._sparse_format = False  # detected on load
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        self.model_dir = os.path.join(app.root_path, 'model')
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)
        print("Recommendation system is ready (Lazy loading mode).")

    def _ensure_models_loaded(self):
        if self.movie_df is not None and self.movie_similarity is not None and \
           self.tv_df is not None and self.tv_similarity is not None:
            return True
        try:
            if not self.model_dir:
                root_path = self.app.root_path if self.app else current_app.root_path
                self.model_dir = os.path.join(root_path, 'model')

            model_urls = (self.app.config if self.app else current_app.config)['MODEL_URLS']
            for filename, url in model_urls.items():
                destination = os.path.join(self.model_dir, filename)
                if not os.path.exists(destination):
                    print(f"Missing {filename}. Downloading it now...")
                    self._download_file(url, destination)

            print("Loading ML models into memory...")

            if self.movie_df is None:
                self.movie_df = joblib.load(os.path.join(self.model_dir, 'tmdb_movies.pkl'))

            if self.movie_similarity is None:
                self.movie_similarity = joblib.load(os.path.join(self.model_dir, 'tmdb_similarity.pkl'))

            if self.tv_df is None:
                self.tv_df = joblib.load(os.path.join(self.model_dir, 'tmdb_tv_series.pkl'))

            if self.tv_similarity is None:
                self.tv_similarity = joblib.load(os.path.join(self.model_dir, 'tmdb_tv_similarity.pkl'))

            # Detect format: sparse dict vs full numpy matrix
            self._sparse_format = isinstance(self.movie_similarity, dict)
            print(f"Models loaded! Format: {'sparse dict' if self._sparse_format else 'full matrix'}")
            return True
        except Exception as e:
            print(f"Failed to load models: {e}")
            return False

    def _download_file(self, url, destination):
        try:
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            with open(destination, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Done downloading {destination}")
        except Exception as e:
            print(f"Download failed for {destination}: {e}")
            if os.path.exists(destination):
                os.remove(destination)

    def get_best_match(self, title, choices):
        match = process.extractOne(title, choices, score_cutoff=80)
        return match[0] if match else None

    def _get_similar_indices(self, similarity, index):
        """Works with both sparse dict and full numpy matrix formats."""
        if isinstance(similarity, dict):
            # New sparse format: {index: [(idx, score), ...]}
            pairs = similarity.get(index, [])
            return sorted(pairs, key=lambda x: x[1], reverse=True)
        else:
            # Legacy full matrix format
            row = list(enumerate(similarity[index]))
            return sorted(row, key=lambda x: x[1], reverse=True)[1:]

    def get_movie_recommendations(self, movie_name):
        if not self._ensure_models_loaded():
            return None, []

        titles = self.movie_df["title"].tolist()
        closest_match = self.get_best_match(movie_name, titles)
        if not closest_match:
            print(f"Couldn't find a good match for: {movie_name}")
            return None, []

        idx = self.movie_df[self.movie_df.title == closest_match].index.values[0]
        searched_row = self.movie_df.iloc[idx]
        searched_movie = {
            "id": int(searched_row["id"]),
            "title": searched_row["title"],
            "poster_path": searched_row["poster_path"]
        }

        similar = self._get_similar_indices(self.movie_similarity, idx)

        recs = []
        seen = set()
        for i, _ in similar:
            if i == idx:
                continue
            movie = self.movie_df.iloc[i]
            title = movie["title"]
            if title in seen or not movie.get("poster_path"):
                continue
            seen.add(title)
            recs.append({
                "id": int(movie["id"]),
                "title": title,
                "poster_path": movie["poster_path"]
            })
            if len(recs) == 30:
                break

        return searched_movie, recs

    def get_tv_recommendations(self, tv_name):
        if not self._ensure_models_loaded():
            return None, []

        title_col = "name" if "name" in self.tv_df.columns else "title"
        titles = self.tv_df[title_col].tolist()
        closest_match = self.get_best_match(tv_name, titles)
        if not closest_match:
            print(f"TV show not found: {tv_name}")
            return None, []

        idx = self.tv_df[self.tv_df[title_col] == closest_match].index.values[0]
        searched_row = self.tv_df.iloc[idx]
        searched_tv = {
            "id": int(searched_row["id"]),
            "name": searched_row[title_col],
            "poster_path": searched_row["poster_path"]
        }

        similar = self._get_similar_indices(self.tv_similarity, idx)

        recs = []
        seen = set()
        for i, _ in similar:
            if i == idx:
                continue
            show = self.tv_df.iloc[i]
            name = show[title_col]
            if name in seen or not show.get("poster_path"):
                continue
            seen.add(name)
            recs.append({
                "id": int(show["id"]),
                "name": name,
                "poster_path": show["poster_path"]
            })
            if len(recs) == 30:
                break

        return searched_tv, recs


recommendation_service = RecommendationService()