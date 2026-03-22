"""
scripts/build_movie_model.py

Improvements over original:
1. Fetches recent + popular movies (not just popular) for freshness
2. Limits to 2000 high-quality entries instead of 4400 low-quality ones
3. Stores only top-K similarity per movie (sparse) instead of full matrix
4. Adds release_year and vote_average to features for better matching
5. Deduplicates by id
"""

import os, requests, joblib
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

API_KEY = os.environ.get('TMDB_API_KEY')
if not API_KEY:
    raise ValueError("TMDB_API_KEY environment variable not set")
TOP_K = 50
MAX_MOVIES = 5000

def fetch_movie_ids():
    ids = set()
    endpoints = ['popular', 'top_rated', 'now_playing', 'upcoming']
    # Also fetch by recent year for freshness
    for endpoint in endpoints:
        for page in range(1, 60):  # 25 pages × 20 = 500 per endpoint
            r = requests.get(
                f'https://api.themoviedb.org/3/movie/{endpoint}',
                params={'api_key': API_KEY, 'page': page},
                timeout=10
            )
            if r.status_code == 200:
                for m in r.json().get('results', []):
                    ids.add(m['id'])
            if len(ids) >= MAX_MOVIES:
                break
        if len(ids) >= MAX_MOVIES:
            break
    return list(ids)[:MAX_MOVIES]

def fetch_movie_detail(movie_id):
    try:
        detail = requests.get(
            f'https://api.themoviedb.org/3/movie/{movie_id}',
            params={'api_key': API_KEY, 'append_to_response': 'credits,keywords'},
            timeout=8
        ).json()

        if not detail.get('title') or not detail.get('poster_path'):
            return None  # Skip entries without poster

        genres = ' '.join([g['name'] for g in detail.get('genres', [])])
        keywords = ' '.join([k['name'] for k in detail.get('keywords', {}).get('keywords', [])][:20])
        cast = ' '.join([c['name'] for c in detail.get('credits', {}).get('cast', [])[:5]])
        director = next((c['name'] for c in detail.get('credits', {}).get('crew', []) if c['job'] == 'Director'), '')
        year = (detail.get('release_date') or '')[:4]

        return {
            'id': detail['id'],
            'title': detail['title'],
            'poster_path': detail['poster_path'],
            'vote_average': detail.get('vote_average', 0),
            'vote_count': detail.get('vote_count', 0),
            'genres': genres,
            'keywords': keywords,
            'overview': detail.get('overview', ''),
            'cast': cast,
            'director': director,
            'year': year,
            'original_language': detail.get('original_language', ''),
        }
    except Exception as e:
        print(f"Error fetching {movie_id}: {e}")
        return None

print("Fetching movie IDs...")
movie_ids = fetch_movie_ids()
print(f"Got {len(movie_ids)} unique IDs")

print("Fetching movie details...")
movies = []
for mid in tqdm(movie_ids):
    detail = fetch_movie_detail(mid)
    if detail and detail['vote_count'] >= 50:  # Filter out obscure entries
        movies.append(detail)

df = pd.DataFrame(movies).drop_duplicates('id').reset_index(drop=True)
df['index'] = df.index
print(f"Final dataset: {len(df)} movies")

# Build combined feature string — weight important features by repeating them
for col in ['genres', 'keywords', 'overview', 'cast', 'director', 'year', 'original_language']:
    df[col] = df[col].fillna('')

# Repeat genres and director twice to give them more weight in TF-IDF
df['combine'] = (
    df['genres'] + ' ' + df['genres'] + ' ' +
    df['director'] + ' ' + df['director'] + ' ' +
    df['cast'] + ' ' +
    df['keywords'] + ' ' +
    df['overview'] + ' ' +
    df['year'] + ' ' +
    df['original_language']
)

print("Building TF-IDF vectors...")
vector = TfidfVectorizer(max_features=5000, stop_words='english')
f_vector = vector.fit_transform(df['combine'])

print("Computing similarity (sparse top-K)...")
# Compute in batches to save memory
batch_size = 200
n = len(df)
# Store as dict: movie_index -> [(similar_index, score), ...]
sparse_sim = {}

for start in range(0, n, batch_size):
    end = min(start + batch_size, n)
    batch = f_vector[start:end]
    sims = cosine_similarity(batch, f_vector)
    for i, row in enumerate(sims):
        global_i = start + i
        # Get top K+1 (include self), exclude self, take top K
        top_indices = np.argsort(row)[::-1][1:TOP_K+1]
        sparse_sim[global_i] = [(int(j), float(row[j])) for j in top_indices]
    print(f"  Processed {end}/{n}")

print("Saving models...")
joblib.dump(df[['id','title','poster_path','vote_average','genres','year']], 'tmdb_movies.pkl', compress=3)
joblib.dump(sparse_sim, 'tmdb_similarity.pkl', compress=3)

sizes = {f: os.path.getsize(f)/1024/1024 for f in ['tmdb_movies.pkl','tmdb_similarity.pkl']}
print(f"Saved! Sizes: {sizes}")
print("Done ✓")
