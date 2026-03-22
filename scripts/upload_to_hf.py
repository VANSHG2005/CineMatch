"""
scripts/upload_to_hf.py
Uploads rebuilt models to HuggingFace Hub
Requires: HF_TOKEN env var, huggingface_hub installed
"""
import os
from huggingface_hub import HfApi

HF_TOKEN = os.environ['HF_TOKEN']
REPO_ID = "VANSHGARG2005/cinematch-models"  # your existing HF repo

api = HfApi()

files = [
    ('tmdb_movies.pkl',       'tmdb_movies.pkl'),
    ('tmdb_similarity.pkl',   'tmdb_similarity.pkl'),
    ('tmdb_tv_shows.pkl',     'tmdb_tv_shows.pkl'),
    ('tmdb_tv_similarity.pkl','tmdb_tv_similarity.pkl'),
]

for local, remote in files:
    print(f"Uploading {local}...")
    api.upload_file(
        path_or_fileobj=local,
        path_in_repo=remote,
        repo_id=REPO_ID,
        repo_type="model",
        token=HF_TOKEN,
    )
    print(f"  ✓ {remote} uploaded")

print("All models uploaded to HuggingFace!")
