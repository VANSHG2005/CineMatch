import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const GenrePage = () => {
  const { type, id } = useParams();
  const [data, setData] = useState({ genre_name: '', movies: [], tv_shows: [] });
  const [loading, setLoading] = useState(true);
  const fetchKey = useRef(null);

  useEffect(() => {
    const key = `${type}-${id}`;
    if (fetchKey.current === key) return;
    fetchKey.current = key;

    const fetchGenreContent = async () => {
      setLoading(true);
      try {
        const response = await tmdbApi.getGenreContent(type, id);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching genre content:", error);
        fetchKey.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchGenreContent();
    window.scrollTo(0, 0);
  }, [type, id]);

  if (loading) return <div className="loading-spinner">Loading {data.genre_name || 'Genre'}...</div>;

  return (
    <div className="genre-browse-container">
      <h1 className="section-title">{data.genre_name}</h1>
      
      {data.movies.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 className="section-title" style={{ borderLeftColor: '#e50914' }}>Movies</h2>
          <div className="content-grid">
            {data.movies.map(movie => (
              <MovieCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>
        </section>
      )}

      {data.tv_shows.length > 0 && (
        <section>
          <h2 className="section-title" style={{ borderLeftColor: '#00c853' }}>TV Shows</h2>
          <div className="content-grid">
            {data.tv_shows.map(show => (
              <MovieCard key={show.id} item={show} type="tv" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default GenrePage;
