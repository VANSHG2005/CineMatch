import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import ContinueWatchingRow from '../components/ContinueWatchingRow';

const SkeletonRow = () => (
  <div className="scrolling-row">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="content-card" style={{ width: '160px' }}>
        <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3', borderRadius: '6px' }}></div>
        <div className="skeleton" style={{ height: '15px', marginTop: '10px', width: '80%' }}></div>
      </div>
    ))}
  </div>
);

const HeroCarousel = ({ items, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (loading || !items || items.length === 0 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 7));
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, items, isPaused]);

  if (loading || !items || items.length === 0) {
    return (
      <div className="movie-hero skeleton" style={{ minHeight: '500px', opacity: 0.3, marginBottom: '40px' }}></div>
    );
  }

  const item = items[currentIndex];
  const imgUrl = 'https://image.tmdb.org/t/p/original';
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').substring(0, 4);

  return (
    <div 
      className="movie-hero" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url('${imgUrl}${item.backdrop_path}')`,
        marginBottom: '40px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="movie-hero-container">
        <div className="movie-hero-row" style={{ flexWrap: 'nowrap' }}>
          <div className="movie-info" style={{ textAlign: 'left' }}>
            <span style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px', display: 'inline-block' }}>
              # {currentIndex + 1} Trending Today
            </span>
            <h1 className="movie-title" style={{ fontSize: '3.5rem', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>
              {title} {year && <span className="movie-year">({year})</span>}
            </h1>
            <p className="movie-overview-text" style={{ maxWidth: '600px', margin: '20px 0 35px', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
              {item.overview?.length > 200 ? item.overview.substring(0, 200) + '...' : item.overview}
            </p>
            <div className="action-buttons">
              <Link to={`/${item.media_type || 'movie'}/${item.id}`} className="btn-watch-now">
                <i className="fas fa-play"></i> Watch Now
              </Link>
              <Link to={`/${item.media_type || 'movie'}/${item.id}`} className="btn-trailer" style={{ textDecoration: 'none' }}>
                <i className="fas fa-info-circle"></i> More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Carousel Indicators */}
      <div style={{ 
        position: 'absolute', bottom: '20px', right: '40px', 
        display: 'flex', gap: '8px', zIndex: 10 
      }}>
        {items.slice(0, 7).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: idx === currentIndex ? '30px' : '10px',
              height: '10px',
              borderRadius: '5px',
              border: 'none',
              background: idx === currentIndex ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>

      {/* Manual Controls */}
      <button 
        onClick={() => setCurrentIndex((prev) => (prev - 1 + Math.min(items.length, 7)) % Math.min(items.length, 7))}
        style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', padding: '15px 10px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 7))}
        style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', padding: '15px 10px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

const ScrollableRow = ({ title, items, type, loading }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -600 : 600, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    return () => el.removeEventListener('scroll', checkScroll);
  }, [items]);

  return (
    <section className="movies-section" style={{ position: 'relative', marginBottom: '40px' }}>
      <h2 className="section-title">{title}</h2>
      <div style={{ position: 'relative' }}>
        {canScrollLeft && (
          <button className="scroll-arrow scroll-arrow-left" onClick={() => scroll('left')}>
            <i className="fas fa-chevron-left"></i>
          </button>
        )}
        {loading ? (
          <SkeletonRow />
        ) : (
          <div className="scrolling-row" ref={rowRef}>
            {items.map(item => (
              <MovieCard key={item.id} item={item} type={type} />
            ))}
          </div>
        )}
        {canScrollRight && !loading && (
          <button className="scroll-arrow scroll-arrow-right" onClick={() => scroll('right')}>
            <i className="fas fa-chevron-right"></i>
          </button>
        )}
      </div>
    </section>
  );
};

const Home = ({ user }) => {
  const [data, setData] = useState({
    trending_movies: [],
    trending_tv: [],
    popular_movies: [],
    popular_tv: [],
    top_rated_movies: [],
    upcoming_movies: [],
    indian_movies: []
  });
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fetchData = async () => {
      try {
        const response = await tmdbApi.getInitData();
        setData(response.data);
      } catch (error) {
        console.error("Error fetching home data:", error);
        initialized.current = false;
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="genre-browse-container">
      <HeroCarousel items={data.trending_movies} loading={loading} />
      
      <ContinueWatchingRow user={user} />
      
      <ScrollableRow title="Trending Movies" items={data.trending_movies} type="movie" loading={loading} />
      <ScrollableRow title="Trending TV Shows" items={data.trending_tv} type="tv" loading={loading} />
      <ScrollableRow title="Popular Movies" items={data.popular_movies} type="movie" loading={loading} />
      <ScrollableRow title="Popular TV Shows" items={data.popular_tv} type="tv" loading={loading} />
      <ScrollableRow title="Top Rated Movies" items={data.top_rated_movies} type="movie" loading={loading} />
      <ScrollableRow title="Upcoming Movies" items={data.upcoming_movies} type="movie" loading={loading} />
      <ScrollableRow title="Indian Hits" items={data.indian_movies} type="movie" loading={loading} />
    </div>
  );
};

export default Home;
