"""
scripts/build_tv_model.py — same improvements as build_movie_model.py
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
MAX_SHOWS = 5000

def fetch_tv_ids():
    ids = set()
    endpoints = ['popular', 'top_rated', 'on_the_air', 'airing_today']
    for endpoint in endpoints:
        for page in range(1, 60):
            r = requests.get(
                f'https://api.themoviedb.org/3/tv/{endpoint}',
                params={'api_key': API_KEY, 'page': page},
                timeout=10
            )
            if r.status_code == 200:
                for s in r.json().get('results', []):
                    ids.add(s['id'])
            if len(ids) >= MAX_SHOWS:
                break
        if len(ids) >= MAX_SHOWS:
            break
    return list(ids)[:MAX_SHOWS]

def fetch_tv_detail(show_id):
    try:
        detail = requests.get(
            f'https://api.themoviedb.org/3/tv/{show_id}',
            params={'api_key': API_KEY, 'append_to_response': 'credits,keywords'},
            timeout=8
        ).json()

        if not detail.get('name') or not detail.get('poster_path'):
            return None

        genres = ' '.join([g['name'] for g in detail.get('genres', [])])
        keywords = ' '.join([k['name'] for k in detail.get('keywords', {}).get('results', [])][:20])
        cast = ' '.join([c['name'] for c in detail.get('credits', {}).get('cast', [])[:5]])
        creators = ' '.join([c['name'] for c in detail.get('created_by', [])])
        year = (detail.get('first_air_date') or '')[:4]

        return {
            'id': detail['id'],
            'name': detail['name'],
            'poster_path': detail['poster_path'],
            'vote_average': detail.get('vote_average', 0),
            'vote_count': detail.get('vote_count', 0),
            'genres': genres,
            'keywords': keywords,
            'overview': detail.get('overview', ''),
            'cast': cast,
            'creators': creators,
            'year': year,
            'original_language': detail.get('original_language', ''),
            'number_of_seasons': str(detail.get('number_of_seasons', '')),
        }
    except Exception as e:
        print(f"Error fetching show {show_id}: {e}")
        return None

print("Fetching TV show IDs...")
tv_ids = fetch_tv_ids()
print(f"Got {len(tv_ids)} unique IDs")

print("Fetching TV show details...")
shows = []
for sid in tqdm(tv_ids):
    detail = fetch_tv_detail(sid)
    if detail and detail['vote_count'] >= 20:
        shows.append(detail)

df = pd.DataFrame(shows).drop_duplicates('id').reset_index(drop=True)
df['index'] = df.index
print(f"Final dataset: {len(df)} shows")

for col in ['genres', 'keywords', 'overview', 'cast', 'creators', 'year', 'original_language', 'number_of_seasons']:
    df[col] = df[col].fillna('')

df['combine'] = (
    df['genres'] + ' ' + df['genres'] + ' ' +
    df['creators'] + ' ' + df['creators'] + ' ' +
    df['cast'] + ' ' +
    df['keywords'] + ' ' +
    df['overview'] + ' ' +
    df['year'] + ' ' +
    df['number_of_seasons'] + ' ' +
    df['original_language']
)

print("Building TF-IDF vectors...")
vector = TfidfVectorizer(max_features=5000, stop_words='english')
f_vector = vector.fit_transform(df['combine'])

print("Computing similarity (sparse top-K)...")
batch_size = 200
n = len(df)
sparse_sim = {}

for start in range(0, n, batch_size):
    end = min(start + batch_size, n)
    batch = f_vector[start:end]
    sims = cosine_similarity(batch, f_vector)
    for i, row in enumerate(sims):
        global_i = start + i
        top_indices = np.argsort(row)[::-1][1:TOP_K+1]
        sparse_sim[global_i] = [(int(j), float(row[j])) for j in top_indices]
    print(f"  Processed {end}/{n}")

print("Saving models...")
joblib.dump(df[['id','name','poster_path','vote_average','genres','year']], 'tmdb_tv_shows.pkl', compress=3)
joblib.dump(sparse_sim, 'tmdb_tv_similarity.pkl', compress=3)

sizes = {f: os.path.getsize(f)/1024/1024 for f in ['tmdb_tv_shows.pkl','tmdb_tv_similarity.pkl']}
print(f"Saved! Sizes: {sizes}")
print("Done ✓")
