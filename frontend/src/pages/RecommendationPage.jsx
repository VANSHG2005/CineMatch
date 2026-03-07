import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const RecommendationPage = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [searchType, setSearchType] = useState(location.state?.type || 'movie');
  const [searchedItem, setSearchedItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);

  useEffect(() => {
    if (location.state?.query) {
      handleFetch(location.state.query, location.state.type || 'movie');
    }
  }, [location.state]);

  const handleFetch = async (query, type) => {
    const fetchKey = `${type}-${query}`;
    if (lastFetchRef.current === fetchKey) return;
    lastFetchRef.current = fetchKey;

    setLoading(true);
    setError(null);
    try {
      const response = await tmdbApi.recommend(query, type);
      setSearchedItem(response.data.searched_item);
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err.response?.data?.error || "We couldn't find that title. Please check the spelling and try again.");
      setSearchedItem(null);
      setRecommendations([]);
      lastFetchRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleFetch(searchQuery, searchType);
    }
  };

  return (
    <div className="recommendation-page">
      <section className="recommend-hero">
        <div className="container">
          <h1 className="recommend-title">Discover Your Next Favorite</h1>
          <p className="recommend-subtitle">
            Enter a movie or TV show you enjoyed, and our AI will analyze its DNA 
            to find titles with similar themes, styles, and stories.
          </p>
          
          <div className="search-container-v2">
            <form className="search-box-v2" onSubmit={onSearchSubmit}>
              <input 
                className="search-input-v2" 
                type="text" 
                placeholder="Type a movie or show name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required 
              />
              <select 
                className="search-type-v2"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
              </select>
              <button className="search-btn-v2" type="submit" disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Discover'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="genre-browse-container">
        {error && (
          <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto 40px', borderRadius: '50px' }}>
            <i className="fas fa-circle-exclamation" style={{ marginRight: '10px' }}></i>
            {error}
          </div>
        )}

        {loading && (
          <div className="content-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '12px' }}></div>
            ))}
          </div>
        )}

        {!loading && searchedItem && (
          <section className="result-header-card">
            <img 
              src={`${IMAGE_URL}${searchedItem.poster_path}`} 
              alt={searchedItem.title || searchedItem.name}
              style={{ width: '150px', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.6)' }}
              onError={(e) => e.target.src = '/default-poster.png'}
            />
            <div>
              <span style={{ color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Because you liked
              </span>
              <h2 style={{ fontSize: '2.5rem', margin: '5px 0 15px', fontWeight: '800' }}>
                {searchedItem.title || searchedItem.name}
              </h2>
              <p style={{ color: '#aaa', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
                Our model found {recommendations.length} similar titles based on shared characteristics. 
                These recommendations are updated in real-time as our community grows.
              </p>
            </div>
          </section>
        )}

        {!loading && recommendations.length > 0 && (
          <section>
            <h2 className="section-title">Handpicked Recommendations</h2>
            <div className="content-grid">
              {recommendations.map(item => (
                <div key={item.id} style={{ width: '100%' }}>
                  <MovieCard item={item} type={searchType} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default RecommendationPage;
