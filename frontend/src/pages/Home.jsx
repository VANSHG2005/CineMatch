import { useState, useEffect, useRef } from 'react';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

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
    <section className="movies-section" style={{ position: 'relative' }}>
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

const Home = () => {
  const [data, setData] = useState({
    trending_movies: [],
    trending_tv: [],
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
      <ScrollableRow title="Trending Movies" items={data.trending_movies} type="movie" loading={loading} />
      <ScrollableRow title="Trending TV Shows" items={data.trending_tv} type="tv" loading={loading} />
      <ScrollableRow title="Indian Hits" items={data.indian_movies} type="movie" loading={loading} />
    </div>
  );
};

export default Home;