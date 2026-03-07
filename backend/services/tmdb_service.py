import requests
import random
from datetime import datetime, timedelta
from flask import current_app

class TMDBService:
    @staticmethod
    def get_api_key():
        return current_app.config['TMDB_API_KEY']

    @staticmethod
    def fetch_movies_by_category(category, genre_id=None):
        api_key = TMDBService.get_api_key()
        try:
            # 15 years ago
            years_ago = (datetime.today() - timedelta(days=15*365)).strftime('%Y-%m-%d')
            
            # Randomize page
            random_page = random.randint(1, 5)
            
            url = f"https://api.themoviedb.org/3/movie/{category}" if not genre_id else \
                  f"https://api.themoviedb.org/3/discover/movie"
            
            params = {
                "api_key": api_key,
                "page": random_page,
                "primary_release_date.gte": years_ago
            }
            
            if genre_id:
                params["with_genres"] = genre_id
                
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get("results", [])
            
            # Additional filter for now_playing
            today = datetime.today().strftime('%Y-%m-%d')
            if category == 'now_playing':
                results = [m for m in results if m.get('release_date') and m['release_date'] <= today]
            
            # Shuffle for more variety
            random.shuffle(results)
                
            return results[:20]
        except requests.RequestException as e:
            print(f"Error fetching movies for {category}: {e}")
            return []

    @staticmethod
    def fetch_tv_by_category(category, genre_id=None):
        api_key = TMDBService.get_api_key()
        try:
            years_ago = (datetime.today() - timedelta(days=15*365)).strftime('%Y-%m-%d')
            random_page = random.randint(1, 5)
            
            if category == 'upcoming':
                url = f"https://api.themoviedb.org/3/discover/tv"
                tomorrow = (datetime.today() + timedelta(days=1)).strftime('%Y-%m-%d')
                params = {
                    "api_key": api_key,
                    "first_air_date.gte": tomorrow,
                    "sort_by": "popularity.desc",
                    "page": 1 # Keep upcoming on page 1
                }
            else:
                url = f"https://api.themoviedb.org/3/tv/{category}" if not genre_id else \
                      f"https://api.themoviedb.org/3/discover/tv"
                params = {
                    "api_key": api_key,
                    "page": random_page,
                    "first_air_date.gte": years_ago
                }
                if genre_id:
                    params["with_genres"] = genre_id
                
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get("results", [])
            
            today = datetime.today().strftime('%Y-%m-%d')
            if category == 'on_the_air':
                results = [s for s in results if s.get('first_air_date') and s['first_air_date'] <= today]
            
            random.shuffle(results)
            return results[:20]
        except requests.RequestException as e:
            print(f"Error fetching TV shows for {category}: {e}")
            return []

    @staticmethod
    def get_movie_details(movie_id):
        api_key = TMDBService.get_api_key()
        try:
            url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}&language=en-US&append_to_response=credits,videos,similar,watch/providers"
            response = requests.get(url)
            if response.status_code != 200:
                return None
            return response.json()
        except Exception as e:
            print(f"Error fetching movie details: {e}")
            return None

    @staticmethod
    def get_tv_details(tv_id):
        api_key = TMDBService.get_api_key()
        try:
            url = f"https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language=en-US&append_to_response=credits,videos,similar,watch/providers"
            response = requests.get(url)
            if response.status_code != 200:
                return None
            return response.json()
        except Exception as e:
            print(f"Error fetching TV details: {e}")
            return None

    @staticmethod
    def fetch_trending(media_type, time_window='day'):
        api_key = TMDBService.get_api_key()
        try:
            # Randomize trend page (limited as trends drop off quickly)
            random_page = random.randint(1, 3)
            url = f"https://api.themoviedb.org/3/trending/{media_type}/{time_window}"
            params = {"api_key": api_key, "page": random_page}
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get("results", [])
            
            # Recency filter
            years_ago = (datetime.today() - timedelta(days=15*365)).strftime('%Y-%m-%d')
            date_key = 'release_date' if media_type == 'movie' else 'first_air_date'
            
            filtered = [r for r in results if r.get(date_key) and r[date_key] >= years_ago]
            random.shuffle(filtered)
            return filtered[:20]
        except requests.RequestException as e:
            print(f"Error fetching trending {media_type}: {e}")
            return []

    @staticmethod
    def fetch_indian_content(media_type):
        api_key = TMDBService.get_api_key()
        try:
            random_page = random.randint(1, 5)
            years_ago = (datetime.today() - timedelta(days=15*365)).strftime('%Y-%m-%d')
            url = f"https://api.themoviedb.org/3/discover/{media_type}"
            params = {
                "api_key": api_key,
                "region": "IN",
                "with_original_language": "hi|te|ta|ml|kn|pa|bn",
                "sort_by": "popularity.desc",
                "page": random_page,
                "primary_release_date.gte" if media_type == 'movie' else "first_air_date.gte": years_ago
            }
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get("results", [])
            random.shuffle(results)
            return results[:20]
        except requests.RequestException as e:
            print(f"Error fetching Indian {media_type}: {e}")
            return []

    @staticmethod
    def get_person_details(person_id):
        api_key = TMDBService.get_api_key()
        try:
            url = f"https://api.themoviedb.org/3/person/{person_id}?api_key={api_key}&append_to_response=combined_credits,images"
            response = requests.get(url)
            if response.status_code != 200:
                return None
            return response.json()
        except Exception as e:
            print(f"Error fetching person details: {e}")
            return None

    @staticmethod
    def search(query, media_type='movie'):
        api_key = TMDBService.get_api_key()
        try:
            url = f"https://api.themoviedb.org/3/search/{media_type}?api_key={api_key}&query={query}"
            response = requests.get(url)
            if response.status_code == 200:
                return response.json().get('results', [])
            return []
        except Exception as e:
            print(f"Error searching {media_type}: {e}")
            return []
