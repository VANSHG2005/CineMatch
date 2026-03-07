import { useState } from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ item, type }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const title = item.title || item.name;

  return (
    <Link to={`/${type}/${item.id}`} className="content-card">
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3' }}>
        {(!loaded || error) && (
          <div className="image-placeholder" style={{ position: 'absolute', top: 0, left: 0 }}>
            <i className="fas fa-film" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
            <span style={{ fontSize: '0.7rem', padding: '0 5px' }}>{title}</span>
          </div>
        )}
        
        {item.vote_average > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: item.vote_average >= 7 ? '#21d07a' : item.vote_average >= 5 ? '#d2d531' : '#db2360',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 2,
            border: '1px solid currentColor'
          }}>
            {Math.round(item.vote_average * 10)}%
          </div>
        )}
        
        {!error && item.poster_path && (
          <img 
            src={`${imgUrl}${item.poster_path}`} 
            alt={title}
            className={`poster-image ${loaded ? 'loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="content-title">{title}</div>
    </Link>
  );
};

export default MovieCard;
