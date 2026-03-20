import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const SUGGESTIONS = {
  movie: ['Inception', 'The Dark Knight', 'Interstellar', 'Parasite', 'The Godfather', 'Pulp Fiction', 'Fight Club', 'Avengers'],
  tv: ['Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office', 'Sherlock', 'Peaky Blinders', 'Squid Game', 'Friends'],
};

const RecommendationPage = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [searchType, setSearchType] = useState(location.state?.type || 'movie');
  const [searchedItem, setSearchedItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);
  const inputRef = useRef(null);

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
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.error || "We couldn't find that title. Check spelling and try again.");
      setSearchedItem(null);
      setRecommendations([]);
      lastFetchRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) handleFetch(searchQuery.trim(), searchType);
  };

  const onSuggestionClick = (s) => {
    setSearchQuery(s);
    handleFetch(s, searchType);
  };

  const hasResults = !loading && recommendations.length > 0;

  return (
    <div className="recommendation-page">

      {/* Hero Section */}
      <section className="recommend-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.15 }}>
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #e50914, transparent)', top: '-150px', left: '-100px', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #2196f3, transparent)', bottom: '-100px', right: '-50px', filter: 'blur(80px)' }} />
        </div>

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#e50914', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
              <i className="fas fa-wand-magic-sparkles"></i> AI Powered
            </div>
            <h1 className="recommend-title" style={{ marginBottom: '12px' }}>Find Your Next Obsession</h1>
            <p className="recommend-subtitle" style={{ maxWidth: '520px', margin: '0 auto' }}>
              Tell us what you love — our model maps its DNA and surfaces titles that share the same soul.
            </p>
          </div>

          {/* Type Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', background: '#1a1a1a', borderRadius: '30px', padding: '4px', border: '1px solid #333' }}>
              {[['movie', 'fa-film', 'Movies'], ['tv', 'fa-tv', 'TV Shows']].map(([val, icon, label]) => (
                <button key={val} onClick={() => setSearchType(val)} style={{
                  padding: '8px 22px', borderRadius: '26px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700',
                  background: searchType === val ? '#e50914' : 'transparent',
                  color: searchType === val ? 'white' : '#888', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '7px'
                }}>
                  <i className={`fas ${icon}`}></i> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={onSearchSubmit} style={{ display: 'flex', maxWidth: '620px', margin: '0 auto 20px', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="fas fa-magnifying-glass" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }}></i>
              <input
                ref={inputRef}
                className="search-input-v2"
                type="text"
                placeholder={`e.g. "${SUGGESTIONS[searchType][0]}"`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>
            <button className="search-btn-v2" type="submit" disabled={loading} style={{ minWidth: '110px' }}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-wand-magic-sparkles" style={{ marginRight: '7px' }}></i>Discover</>}
            </button>
          </form>

          {/* Suggestion Pills */}
          {!hasResults && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '620px', margin: '0 auto' }}>
              <span style={{ color: '#555', fontSize: '0.8rem', lineHeight: '30px' }}>Try:</span>
              {SUGGESTIONS[searchType].slice(0, 6).map(s => (
                <button key={s} onClick={() => onSuggestionClick(s)} style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px',
                  padding: '5px 14px', fontSize: '0.8rem', color: '#aaa', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#e50914'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#aaa'; }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="genre-browse-container">

        {/* Error */}
        {error && (
          <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto 30px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-circle-exclamation"></i> {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="small-card-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '8px' }}></div>
            ))}
          </div>
        )}

        {/* Result header */}
        {!loading && searchedItem && (
          <div style={{
            display: 'flex', gap: '28px', alignItems: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)',
            borderRadius: '16px', padding: '28px', marginBottom: '40px', border: '1px solid #2a2a2a',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)', flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={`${IMAGE_URL}${searchedItem.poster_path}`}
                alt={searchedItem.title || searchedItem.name}
                style={{ width: '120px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.7)', display: 'block' }}
                onError={e => e.target.src = '/default-poster.png'}
              />
              <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e50914', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                <i className="fas fa-check"></i>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ color: '#e50914', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
                Because you liked
              </div>
              <h2 style={{ fontSize: '2rem', margin: '0 0 10px', fontWeight: '800', lineHeight: '1.1' }}>
                {searchedItem.title || searchedItem.name}
              </h2>
              <p style={{ color: '#777', fontSize: '0.9rem', margin: 0 }}>
                Found <strong style={{ color: 'white' }}>{recommendations.length}</strong> similar titles based on themes, style &amp; storytelling.
              </p>
            </div>
            <Link
              to={`/${searchType}/${searchedItem.id}`}
              style={{ background: '#e50914', color: 'white', textDecoration: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: '700', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i className="fas fa-circle-info"></i> View Details
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && recommendations.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Handpicked for You</h2>
              <span style={{ color: '#555', fontSize: '0.85rem' }}>{recommendations.length} titles</span>
            </div>
            <div className="small-card-grid">
              {recommendations.map(item => (
                <MovieCard key={item.id} item={item} type={searchType} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state (no search yet) */}
        {!loading && !searchedItem && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎬</div>
            <p style={{ fontSize: '1.1rem' }}>Search for a title above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationPage;