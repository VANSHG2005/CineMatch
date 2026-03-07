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

const ContentRow = ({ title, items, type, loading }) => (
  <section className="movies-section">
    <h2 className="section-title">{title}</h2>
    {loading ? (
      <SkeletonRow />
    ) : (
      <div className="scrolling-row">
        {items.map(item => (
          <MovieCard key={item.id} item={item} type={type} />
        ))}
      </div>
    )}
  </section>
);

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
      <ContentRow title="Trending Movies" items={data.trending_movies} type="movie" loading={loading} />
      <ContentRow title="Trending TV Shows" items={data.trending_tv} type="tv" loading={loading} />
      <ContentRow title="Indian Hits" items={data.indian_movies} type="movie" loading={loading} />
    </div>
  );
};

export default Home;
