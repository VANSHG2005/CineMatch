import joblib
import os
import requests
from rapidfuzz import process
from flask import current_app

class RecommendationService:
    def __init__(self, app=None):
        self.movie_df = None
        self.movie_similarity = None
        self.tv_df = None
        self.tv_similarity = None
        if app:
            self.init_app(app)

    def init_app(self, app):
        model_dir = os.path.join(app.root_path, 'model')
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)

        model_urls = app.config['MODEL_URLS']
        for filename, url in model_urls.items():
            destination = os.path.join(model_dir, filename)
            self._download_file(url, destination)

        try:
            print("Loading models with memory mapping...")
            self.movie_df = joblib.load(os.path.join(model_dir, 'tmdb_movies.pkl'))
            # Use mmap_mode='r' for large similarity matrices to save RAM
            self.movie_similarity = joblib.load(os.path.join(model_dir, 'tmdb_similarity.pkl'), mmap_mode='r')
            
            self.tv_df = joblib.load(os.path.join(model_dir, 'tmdb_tv_series.pkl'))
            self.tv_similarity = joblib.load(os.path.join(model_dir, 'tmdb_tv_similarity.pkl'), mmap_mode='r')
            
            print("All model files loaded successfully (RAM-optimized).")
        except Exception as e:
            print(f"Error loading models: {e}")

    def _download_file(self, url, destination):
        if not os.path.exists(destination):
            print(f"Downloading {destination}...")
            try:
                response = requests.get(url, stream=True)
                response.raise_for_status()
                with open(destination, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
            except Exception as e:
                print(f"Error downloading {destination}: {e}")
                if os.path.exists(destination):
                    os.remove(destination)

    def get_best_match(self, title, choices):
        match = process.extractOne(title, choices, score_cutoff=80)
        return match[0] if match else None

    def get_movie_recommendations(self, movie_name):
        if self.movie_df is None or self.movie_similarity is None: 
            return None, []
        
        titles = self.movie_df["title"].tolist()
        closest_match = self.get_best_match(movie_name, titles)

        if not closest_match:
            return None, []

        index_of_movie = self.movie_df[self.movie_df.title == closest_match].index.values[0]
        similarity_scores = list(enumerate(self.movie_similarity[index_of_movie]))
        sorted_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

        searched_movie_row = self.movie_df.iloc[index_of_movie]
        searched_movie = {
            "id": int(searched_movie_row["id"]),
            "title": searched_movie_row["title"],
            "poster_path": searched_movie_row["poster_path"]
        }

        recs = []
        titles_seen = set()
        for i, _ in sorted_scores[1:]:
            movie = self.movie_df.iloc[i]
            title = movie["title"]
            if title == searched_movie["title"] or title in titles_seen:
                continue
            titles_seen.add(title)
            recs.append({
                "id": int(movie["id"]),
                "title": title,
                "poster_path": movie["poster_path"]
            })
            if len(recs) == 30:
                break

        return searched_movie, recs

    def get_tv_recommendations(self, tv_name):
        if self.tv_df is None or self.tv_similarity is None: 
            return None, []
            
        title_column = "name" if "name" in self.tv_df.columns else "title"
        titles = self.tv_df[title_column].tolist()
        
        closest_match = self.get_best_match(tv_name, titles)

        if not closest_match:
            return None, []

        index_of_tv = self.tv_df[self.tv_df[title_column] == closest_match].index.values[0]
        similarity_scores = list(enumerate(self.tv_similarity[index_of_tv]))
        sorted_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

        searched_tv_row = self.tv_df.iloc[index_of_tv]
        searched_tv = {
            "id": int(searched_tv_row["id"]),
            "name": searched_tv_row[title_column],
            "poster_path": searched_tv_row["poster_path"]
        }

        recs = []
        titles_seen = set()
        for i, _ in sorted_scores[1:]:
            tv = self.tv_df.iloc[i]
            name = tv[title_column]
            if name == searched_tv["name"] or name in titles_seen:
                continue
            titles_seen.add(name)
            recs.append({
                "id": int(tv["id"]),
                "name": name,
                "poster_path": tv["poster_path"]
            })
            if len(recs) == 30:
                break

        return searched_tv, recs

recommendation_service = RecommendationService()
