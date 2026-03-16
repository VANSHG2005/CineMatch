import joblib
import os
import requests
from rapidfuzz import process
from flask import current_app

class RecommendationService:
    def __init__(self, app=None):
        # Setting these to None initially because the models are huge 
        # and I don't want to load them until they're actually needed.
        self.movie_df = None
        self.movie_similarity = None
        self.tv_df = None
        self.tv_similarity = None
        self.app = None
        self.model_dir = None
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        self.model_dir = os.path.join(app.root_path, 'model')
        # Just making sure the folder exists. The download happens later if files are missing.
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)
            
        print("Recommendation system is ready (Lazy loading mode).")

    def _ensure_models_loaded(self):
        # If everything is already in memory, we're good to go.
        if self.movie_df is not None and self.movie_similarity is not None and \
           self.tv_df is not None and self.tv_similarity is not None:
            return True
            
        try:
            if not self.model_dir:
                root_path = self.app.root_path if self.app else current_app.root_path
                self.model_dir = os.path.join(root_path, 'model')

            # Double checking if the .pkl files actually exist before trying to load them
            model_urls = (self.app.config if self.app else current_app.config)['MODEL_URLS']
            for filename, url in model_urls.items():
                destination = os.path.join(self.model_dir, filename)
                if not os.path.exists(destination):
                    print(f"Missing {filename}. Downloading it now...")
                    self._download_file(url, destination)

            print("Loading ML models into memory... this might take a second.")
            
            # Using mmap_mode='r' for the similarity matrices to save RAM
            if self.movie_df is None:
                self.movie_df = joblib.load(os.path.join(self.model_dir, 'tmdb_movies.pkl'))
            
            if self.movie_similarity is None:
                self.movie_similarity = joblib.load(os.path.join(self.model_dir, 'tmdb_similarity.pkl'), mmap_mode='r')
            
            if self.tv_df is None:
                self.tv_df = joblib.load(os.path.join(self.model_dir, 'tmdb_tv_series.pkl'))
                
            if self.tv_similarity is None:
                self.tv_similarity = joblib.load(os.path.join(self.model_dir, 'tmdb_tv_similarity.pkl'), mmap_mode='r')
            
            print("Models loaded successfully!")
            return True
        except Exception as e:
            print(f"Failed to load models: {e}")
            return False

    def _download_file(self, url, destination):
        # Helper to grab the models from HuggingFace if they aren't local
        try:
            response = requests.get(url, stream=True)
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
        # Using rapidfuzz here to handle typos (it's way better than standard string matching)
        match = process.extractOne(title, choices, score_cutoff=80)
        return match[0] if match else None

    def get_movie_recommendations(self, movie_name):
        if not self._ensure_models_loaded():
            return None, []
        
        titles = self.movie_df["title"].tolist()
        closest_match = self.get_best_match(movie_name, titles)

        if not closest_match:
            print(f"Couldn't find a good match for: {movie_name}")
            return None, []

        # Find the index and then sort by similarity score
        index_of_movie = self.movie_df[self.movie_df.title == closest_match].index.values[0]
        similarity_scores = list(enumerate(self.movie_similarity[index_of_movie]))
        
        # Sort descending so the most similar are at the top
        sorted_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

        searched_movie_row = self.movie_df.iloc[index_of_movie]
        searched_movie = {
            "id": int(searched_movie_row["id"]),
            "title": searched_movie_row["title"],
            "poster_path": searched_movie_row["poster_path"]
        }

        recs = []
        titles_seen = set()
        # Skip the first one because it's the movie itself
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
            if len(recs) == 30: # Limit to 30 so the UI doesn't get overwhelmed
                break

        return searched_movie, recs

    def get_tv_recommendations(self, tv_name):
        # Almost the same as movie recommendations, but for TV shows.
        if not self._ensure_models_loaded():
            return None, []
            
        # Some datasets use 'name' instead of 'title' for TV shows, so I'm checking both just in case.
        title_column = "name" if "name" in self.tv_df.columns else "title"
        titles = self.tv_df[title_column].tolist()
        
        closest_match = self.get_best_match(tv_name, titles)

        if not closest_match:
            print(f"TV show not found in our local database: {tv_name}")
            return None, []

        index_of_tv = self.tv_df[self.tv_df[title_column] == closest_match].index.values[0]
        similarity_scores = list(enumerate(self.tv_similarity[index_of_tv]))
        
        # Sort by similarity
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
