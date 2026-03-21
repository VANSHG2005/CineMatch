import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tmdbApi } from '../services/api';

const MovieCard = ({ item, type }) => {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const hoverTimer = useRef(null);
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const title = item.title || item.name;

  const handleMouseEnter = () => {
    // 600ms delay before fetching — avoids spamming on quick mouse-overs
    hoverTimer.current = setTimeout(() => {
      setHovered(true);
      if (!trailerKey && !trailerLoading) fetchTrailer();
    }, 600);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovered(false);
  };

  const fetchTrailer = async () => {
    setTrailerLoading(true);
    try {
      const res = type === 'movie'
        ? await tmdbApi.getMovieDetail(item.id)
        : await tmdbApi.getTvDetail(item.id);
      const videos = res.data?.details?.videos?.results || res.data?.videos?.results || [];
      const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      setTrailerKey(trailer?.key || null);
    } catch {
      setTrailerKey(null);
    } finally {
      setTrailerLoading(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return (
    <Link
      to={`/${type}/${item.id}`}
      className="content-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden', borderRadius: '6px' }}>
        {/* Poster */}
        {(!loaded || imgError) && (
          <div className="image-placeholder" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            <i className="fas fa-film" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
            <span style={{ fontSize: '0.7rem', padding: '0 5px' }}>{title}</span>
          </div>
        )}

        {item.vote_average > 0 && !hovered && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px', zIndex: 3,
            background: 'rgba(0,0,0,0.8)',
            color: item.vote_average >= 7 ? '#21d07a' : item.vote_average >= 5 ? '#d2d531' : '#db2360',
            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
            border: '1px solid currentColor'
          }}>
            {Math.round(item.vote_average * 10)}%
          </div>
        )}

        {!imgError && item.poster_path && (
          <img
            src={`${imgUrl}${item.poster_path}`}
            alt={title}
            className={`poster-image ${loaded ? 'loaded' : ''}`}
            style={{ transition: 'opacity 0.3s', opacity: hovered && trailerKey ? 0 : 1 }}
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}

        {/* Trailer overlay */}
        {hovered && trailerKey && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&rel=0`}
              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              allow="autoplay"
              title={`${title} trailer`}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
              padding: '20px 8px 8px', fontSize: '0.75rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '6px', color: '#fff'
            }}>
              <i className="fas fa-play" style={{ fontSize: '0.6rem', color: '#e50914' }}></i> Trailer
            </div>
          </div>
        )}

        {/* Loading spinner while fetching trailer */}
        {hovered && trailerLoading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
            <i className="fas fa-spinner fa-spin" style={{ color: '#e50914', fontSize: '1.5rem' }}></i>
          </div>
        )}
      </div>
      <div className="content-title">{title}</div>
    </Link>
  );
};

export default MovieCard;