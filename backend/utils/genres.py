def get_genres_dict():
    return {
        'movies': {
            28: {'name': 'Action', 'tv_match': [10759]},
            12: {'name': 'Adventure', 'tv_match': [10759]},
            16: {'name': 'Animation', 'tv_match': [16]},
            35: {'name': 'Comedy', 'tv_match': [35]},
            80: {'name': 'Crime', 'tv_match': [80]},
            99: {'name': 'Documentary', 'tv_match': [99]},
            18: {'name': 'Drama', 'tv_match': [18]},
            10751: {'name': 'Family', 'tv_match': [10751]},
            14: {'name': 'Fantasy', 'tv_match': [10765]},
            36: {'name': 'History', 'tv_match': []},
            27: {'name': 'Horror', 'tv_match': [9648]},
            10402: {'name': 'Music', 'tv_match': []},
            9648: {'name': 'Mystery', 'tv_match': [9648]},
            10749: {'name': 'Romance', 'tv_match': [10749]},
            878: {'name': 'Science Fiction', 'tv_match': [10765]},
            10770: {'name': 'TV Movie', 'tv_match': []},
            53: {'name': 'Thriller', 'tv_match': [9648]},
            10752: {'name': 'War', 'tv_match': [10768]},
            37: {'name': 'Western', 'tv_match': [37]}
        },
        'tv': {
            10759: {'name': 'Action & Adventure', 'movie_match': [28, 12]},
            16: {'name': 'Animation', 'movie_match': [16]},
            35: {'name': 'Comedy', 'movie_match': [35]},
            80: {'name': 'Crime', 'movie_match': [80]},
            99: {'name': 'Documentary', 'movie_match': [99]},
            18: {'name': 'Drama', 'movie_match': [18]},
            10751: {'name': 'Family', 'movie_match': [10751]},
            10762: {'name': 'Kids', 'movie_match': []},
            9648: {'name': 'Mystery', 'movie_match': [9648, 27, 53]},
            10763: {'name': 'News', 'movie_match': []},
            10764: {'name': 'Reality', 'movie_match': []},
            10765: {'name': 'Sci-Fi & Fantasy', 'movie_match': [878, 14]},
            10766: {'name': 'Soap', 'movie_match': []}, 
            10767: {'name': 'Talk', 'movie_match': []},
            10768: {'name': 'War & Politics', 'movie_match': [10752]},
            37: {'name': 'Western', 'movie_match': [37]}
        }
    }
