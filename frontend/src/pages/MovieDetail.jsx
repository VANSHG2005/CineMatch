import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tmdbApi, watchlistApi } from '../services/api';
import { getStreamingSearchLink } from '../utils/streamingLinks';
import MovieCard from '../components/MovieCard';
import Comments from '../components/Comments';

const MovieDetailSkeleton = () => (
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

const UserScore = ({ score }) => {
  const percentage = Math.round(score * 10);
  const color = score >= 7 ? '#21d07a' : score >= 5 ? '#d2d531' : '#db2360';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
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
        color: 'white'
      }}>
        {percentage}%
      </div>
      <span style={{ marginLeft: '15px', fontWeight: '600', color: 'white' }}>User Score</span>
    </div>
  );
};

const MovieDetail = ({ user }) => {
  const { id } = useParams();
  const [movieData, setMovieData] = useState(null);
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
    
    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await tmdbApi.getMovieDetail(id);
        if (!response.data || !response.data.details) {
          throw new Error("Invalid data structure received from API");
        }
        setMovieData(response.data);
        setIsInWatchlist(response.data.in_watchlist);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.error || err.message || 'Failed to load movie details');
        fetchId.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const toggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await watchlistApi.removeToggle(id, 'movie');
        setIsInWatchlist(false);
      } else {
        const { details } = movieData;
        await watchlistApi.add({
          item_id: details.id,
          item_type: 'movie',
          title: details.title,
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

  if (loading) return <MovieDetailSkeleton />;

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

  if (!movieData) return null;

  const details = movieData.details || {};
  const cast = movieData.cast || [];
  const crew = movieData.crew || [];
  const ml_recommendations = movieData.ml_recommendations || [];
  const api_similar = movieData.api_similar || [];
  const related_movies = movieData.related_movies || [];
  const trailer_key = movieData.trailer_key;
  const streaming_providers = movieData.streaming_providers;

  const renderProviders = (providers, type) => {
    if (!providers || !providers[type]) return null;
    return (
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {type === 'flatrate' ? 'Streaming' : type}
        </h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {providers[type].map(provider => (
            <a href={getStreamingSearchLink(provider.provider_name, details.title)} target="_blank" rel="noopener noreferrer" key={provider.provider_id} className="provider-link">
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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('https://image.tmdb.org/t/p/original${details.backdrop_path}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '60px 4%',
          color: 'white',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#141414'
        }}
      >
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            <div className="col-md-4" style={{ flex: '0 0 300px' }}>
              <div style={{ position: 'relative', aspectRatio: '2/3', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
                {!loadedImages['hero'] && <div className="skeleton skeleton-rect" style={{ position: 'absolute', top: 0, left: 0 }}></div>}
                <img 
                  src={`${imgUrl}${details.poster_path}`} 
                  className={`movie-poster ${loadedImages['hero'] ? 'loaded' : ''}`} 
                  alt={details.title}
                  onLoad={() => handleImageLoad('hero')}
                  onError={(e) => e.target.src = '/default-poster.png'}
                />
              </div>
            </div>
            <div className="col-md-8 movie-info" style={{ flex: '1', minWidth: '300px' }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '800' }}>
                {details.title} <span style={{ opacity: 0.6, fontWeight: 400 }}>({details.release_date?.substring(0, 4)})</span>
              </h1>
              
              <div className="movie-meta" style={{ marginBottom: '20px', fontSize: '1rem', opacity: 0.8, display: 'flex', gap: '15px', alignItems: 'center' }}>
                {details.release_date && <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '4px' }}>{details.release_date}</span>}
                <span>{details.genres?.join(', ')}</span>
                {details.runtime > 0 && <span>{details.runtime}m</span>}
              </div>

              <UserScore score={details.vote_average} />
              
              <div className="action-buttons" style={{ display: 'flex', gap: '15px', marginBottom: '35px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-watch-now" 
                  onClick={() => setShowStreaming(true)}
                  style={{ padding: '12px 28px', background: 'white', color: 'black', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}
                >
                  <i className="fas fa-play"></i> Watch Now
                </button>

                {trailer_key && (
                  <button 
                    className="btn-trailer" 
                    onClick={() => setShowTrailer(true)}
                    style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(10px)' }}
                  >
                    Trailer
                  </button>
                )}

                <button 
                  className="btn-watchlist" 
                  onClick={toggleWatchlist}
                  style={{ padding: '12px 20px', background: isInWatchlist ? 'rgba(229, 9, 20, 0.3)' : 'rgba(0,0,0,0.4)', color: isInWatchlist ? '#ff4d4d' : 'white', border: isInWatchlist ? '1px solid #ff4d4d' : '1px solid rgba(255,255,255,0.5)', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className={`fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}`}></i>
                  <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
              
              {details.tagline && <p style={{ fontStyle: 'italic', opacity: 0.7, marginBottom: '20px', fontSize: '1.2rem' }}>"{details.tagline}"</p>}
              <h3 style={{ fontSize: '1.4rem', marginBottom: '10px', fontWeight: '700' }}>Overview</h3>
              <p style={{ lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '30px', opacity: 0.9, maxWidth: '800px' }}>{details.overview}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 4%', maxWidth: '1200px', margin: '0 auto' }}>
        {cast && cast.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Top Billed Cast</h2>
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

        {related_movies && related_movies.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Franchise / Collection</h2>
            <div className="scrolling-row">
              {related_movies.map(movie => (
                <MovieCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </section>
        )}

        {ml_recommendations && ml_recommendations.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">Recommended for You</h2>
            <div className="scrolling-row">
              {ml_recommendations.map(similar => (
                <MovieCard key={similar.id} item={similar} type="movie" />
              ))}
            </div>
          </section>
        )}

        {api_similar && api_similar.length > 0 && (
          <section style={{ marginBottom: '50px' }}>
            <h2 className="section-title">More Like This</h2>
            <div className="scrolling-row">
              {api_similar.map(similar => (
                <MovieCard key={similar.id} item={similar} type="movie" />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="container" style={{ padding: '0 4% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <Comments itemId={id} itemType="movie" currentUser={user} />
      </div>

      {/* Streaming Modal */}
      {showStreaming && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }} onClick={() => setShowStreaming(false)}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#181818', borderRadius: '12px', position: 'relative', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStreaming(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
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
                  <a href={`https://www.hotstar.com/in/search?q=${details.title}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#001d4a', textAlign: 'center' }}>Hotstar</a>
                  <a href={`https://www.netflix.com/search?q=${details.title}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#e50914', textAlign: 'center' }}>Netflix</a>
                  <a href={`https://www.primevideo.com/search?q=${details.title}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#00a8e1', textAlign: 'center' }}>Prime Video</a>
                  <a href={`https://www.google.com/search?q=watch+${details.title}`} target="_blank" rel="noopener noreferrer" className="btn-signup" style={{ padding: '12px', fontSize: '0.9rem', background: '#333', textAlign: 'center' }}>Google Search</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTrailer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowTrailer(false)}>
          <div style={{ width: '100%', maxWidth: '900px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowTrailer(false)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} src={`https://www.youtube.com/embed/${trailer_key}?autoplay=1`} title="Movie Trailer" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
