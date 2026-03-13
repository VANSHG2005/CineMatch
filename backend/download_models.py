import os
import requests
from config import Config

def download_file(url, destination):
    if not os.path.exists(destination):
        print(f"Downloading {destination} from {url}...")
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(destination, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Successfully downloaded {destination}")
        except Exception as e:
            print(f"Error downloading {destination}: {e}")
            if os.path.exists(destination):
                os.remove(destination)
    else:
        print(f"File {destination} already exists, skipping.")

if __name__ == "__main__":
    model_dir = os.path.join(os.path.dirname(__file__), 'model')
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    model_urls = Config.MODEL_URLS
    for filename, url in model_urls.items():
        destination = os.path.join(model_dir, filename)
        download_file(url, destination)
