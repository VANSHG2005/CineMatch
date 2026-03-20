import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tmdbApi, watchlistApi } from '../services/api';
import { getStreamingSearchLink } from '../utils/streamingLinks';
import MovieCard from '../components/MovieCard';
import Comments from '../components/Comments';

const UserScore = ({ score }) => {
  const percentage = Math.round(score * 10);
  const color = score >= 7 ? '#21d07a' : score >= 5 ? '#d2d531' : '#db2360';
  
  return (
    <div className="user-score-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
      <div style={{ 
        width: '55px', 
        height: '55px', 
        borderRadius: '50%', 
        background: '#081c22', 
        border: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: 'white',
        flexShrink: 0
      }}>
        {percentage}%
      </div>
      <span style={{ marginLeft: '15px', fontWeight: '600', color: 'white' }}>User Score</span>
    </div>
  );
};

const TvDetailSkeleton = () => (
  <div className="movie-detail-container">
    <div className="movie-hero skeleton" style={{ minHeight: '500px', opacity: 0.3 }}></div>
    <div className="container" style={{ padding: '40px 4%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="skeleton-title skeleton"></div>
      <div className="scrolling-row">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton" style={{ width: '140px', height: '210px', borderRadius: '6px', flex: '0 0 auto', marginRight: '15px' }}></div>
        ))}
      </div>
    </div>
  </div>
);

const TvDetail = ({ user }) => {
  const { id } = useParams();
  const [tvData, setTvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const fetchId = useRef(null);

  useEffect(() => {
    if (fetchId.current === id) return;
    fetchId.current = id;
    
    const fetchTvDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await tmdbApi.getTvDetail(id);
        if (!response.data || !response.data.details) {
          throw new Error("Invalid data structure received from API");
        }
        setTvData(response.data);
        setIsInWatchlist(response.data.in_watchlist);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.error || err.message || 'Failed to load TV show details');
        fetchId.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchTvDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const toggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await watchlistApi.removeToggle(id, 'tv');
        setIsInWatchlist(false);
      } else {
        const { details } = tvData;
        await watchlistApi.add({
          item_id: details.id,
          item_type: 'tv',
          title: details.name,
          poster_path: details.poster_path
        });
        setIsInWatchlist(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating watchlist. Please log in first.');
    }
  };

  const handleImageLoad = (imgId) => {
    setLoadedImages(prev => ({ ...prev, [imgId]: true }));
  };

  if (loading) return <TvDetailSkeleton />;
  if (error) {
    return (
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>Oops!</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-auth" style={{ width: 'auto', padding: '10px 20px' }}>Try Again</button>
        <Link to="/" style={{ marginLeft: '20px', color: '#888' }}>Go Home</Link>
      </div>
    );
  }
  if (!tvData) return null;

  const details = tvData.details || {};
  const cast = tvData.cast || [];
  const crew = tvData.crew || [];
  const ml_recommendations = tvData.ml_recommendations || [];
  const api_similar = tvData.api_similar || [];
  const trailer_key = tvData.trailer_key;
  const streaming_providers = tvData.streaming_providers;
  const seasons = details.seasons || [];

  const renderProviders = (providers, type) => {
    if (!providers || !providers[type]) return null;
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {type === 'flatrate' ? 'Streaming' : type}
        </h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {providers[type].map(provider => (
            <a href={getStreamingSearchLink(provider.provider_name, details.name)} target="_blank" rel="noopener noreferrer" key={provider.provider_id} className="provider-link">
              <img src={`${imgUrl}${provider.logo_path}`} alt={provider.provider_name} style={{ width: '45px', borderRadius: '10px' }} title={provider.provider_name} />
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="movie-detail-container">
      <div 
        className="movie-hero" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('https://image.tmdb.org/t/p/original${details.backdrop_path}')`
        }}
      >
        <div className="movie-hero-container">
          <div className="movie-hero-row">
            <div className="movie-poster-container">
              <div className="movie-poster-wrapper">
                {!loadedImages['hero'] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
                <img 
                  src={`${imgUrl}${details.poster_path}`} 
                  className={`movie-poster ${loadedImages['hero'] ? 'loaded' : ''}`} 
                  alt={details.name}
                  onLoad={() => handleImageLoad('hero')}
                  onError={(e) => e.target.src = '/default-poster.png'}
                />
              </div>
            </div>
            <div className="movie-info">
              <h1 className="movie-title">
                {details.name} <span className="movie-year">({details.first_air_date?.substring(0, 4)})</span>
              </h1>
              
              <div className="movie-meta">
                {details.first_air_date && <span className="meta-date">{details.first_air_date}</span>}
                <span>{details.genres?.join(', ')}</span>
                <span>{details.number_of_seasons} Seasons</span>
              </div>

              <UserScore score={details.vote_average} />
              
              <div className="action-buttons">
                <button 
                  className="btn-watch-now" 
                  onClick={() => setShowStreaming(true)}
                >
                  <i className="fas fa-play"></i> Watch Now
                </button>

                {trailer_key && (
                  <button 
                    className="btn-trailer" 
                    onClick={() => setShowTrailer(true)}
                  >
                    Trailer
                  </button>
                )}

                <button 
                  className={`btn-watchlist ${isInWatchlist ? 'in-watchlist' : 'not-in-watchlist'}`}
                  onClick={toggleWatchlist}
                >
                  <i className={`fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}`}></i>
                  <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
              
              {details.tagline && <p className="movie-tagline">"{details.tagline}"</p>}
              <h3 className="movie-overview-title">Overview</h3>
              <p className="movie-overview-text">{details.overview}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 4%', maxWidth: '1200px', margin: '0 auto' }}>
        {seasons && seasons.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Seasons</h2>
            <div className="scrolling-row">
              {seasons.map(season => (
                <div key={season.id} className="content-card" style={{ width: '140px' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
                    {!loadedImages[`season-${season.id}`] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
                    {season.poster_path ? (
                      <img 
                        src={`${imgUrl}${season.poster_path}`} 
                        alt={season.name} 
                        className={`poster-image ${loadedImages[`season-${season.id}`] ? 'loaded' : ''}`}
                        onLoad={() => handleImageLoad(`season-${season.id}`)}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-tv" style={{ fontSize: '2rem', color: '#666' }}></i>
                      </div>
                    )}
                  </div>
                  <div className="content-title" style={{ fontWeight: '600' }}>{season.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{season.episode_count} Episodes</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{season.air_date?.substring(0, 4)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cast && cast.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Series Cast</h2>
            <div className="scrolling-row">
              {cast.map(actor => (
                <Link to={`/person/${actor.id}`} key={actor.id} className="content-card" style={{ width: '140px' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
                    {!loadedImages[`cast-${actor.id}`] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
                    {actor.profile_path ? (
                      <img 
                        src={`${imgUrl}${actor.profile_path}`} 
                        alt={actor.name} 
                        className={`poster-image ${loadedImages[`cast-${actor.id}`] ? 'loaded' : ''}`}
                        onLoad={() => handleImageLoad(`cast-${actor.id}`)}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user" style={{ fontSize: '2rem', color: '#666' }}></i>
                      </div>
                    )}
                  </div>
                  <div className="content-title" style={{ fontWeight: '600' }}>{actor.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{actor.character}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {ml_recommendations && ml_recommendations.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Recommended for You</h2>
            <div className="scrolling-row">
              {ml_recommendations.map(similar => (
                <MovieCard key={similar.id} item={similar} type="tv" />
              ))}
            </div>
          </section>
        )}

        {api_similar && api_similar.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">More Like This</h2>
            <div className="scrolling-row">
              {api_similar.map(similar => (
                <MovieCard key={similar.id} item={similar} type="tv" />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="container" style={{ padding: '0 4% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <Comments itemId={id} itemType="tv" currentUser={user} />
      </div>

      {/* Streaming Modal */}
      {showStreaming && (
        <div className="modal-overlay" onClick={() => setShowStreaming(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowStreaming(false)}><i className="fas fa-times"></i></button>
            <h2 style={{ marginBottom: '30px', fontSize: '1.8rem', textAlign: 'center' }}>Where to Watch</h2>
            {(streaming_providers && (streaming_providers.flatrate || streaming_providers.buy || streaming_providers.rent)) ? (
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {renderProviders(streaming_providers, 'flatrate')}
                {renderProviders(streaming_providers, 'rent')}
                {renderProviders(streaming_providers, 'buy')}
                <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '30px', textAlign: 'center' }}>Streaming data provided by JustWatch</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '30px', color: '#aaa' }}>We couldn't find any direct streaming links. Try searching on these popular platforms:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <a href={`https://www.hotstar.com/in/search?q=${details.name}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#001d4a', textAlign: 'center' }}>Hotstar</a>
                  <a href={`https://www.netflix.com/search?q=${details.name}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#e50914', textAlign: 'center' }}>Netflix</a>
                  <a href={`https://www.primevideo.com/search?q=${details.name}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#00a8e1', textAlign: 'center' }}>Prime Video</a>
                  <a href={`https://www.google.com/search?q=watch+${details.name}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#333', textAlign: 'center' }}>Google Search</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTrailer && (
        <div className="modal-overlay" onClick={() => setShowTrailer(false)}>
          <div className="trailer-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ top: '-40px', right: '0', color: 'white' }} onClick={() => setShowTrailer(false)}><i className="fas fa-times"></i></button>
            <div className="video-responsive">
              <iframe src={`https://www.youtube.com/embed/${trailer_key}?autoplay=1`} title="TV Show Trailer" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TvDetail;
