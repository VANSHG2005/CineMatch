import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const CategoryPage = () => {
  const { type, category } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchKey = useRef(null);

  useEffect(() => {
    const key = `${type}-${category}`;
    if (fetchKey.current === key) return;
    fetchKey.current = key;

    const fetchCategory = async () => {
      setLoading(true);
      try {
        const response = type === 'movie' 
          ? await tmdbApi.getMoviesByCategory(category)
          : await tmdbApi.getTvByCategory(category);
        setItems(response.data);
      } catch (error) {
        console.error("Error fetching category items:", error);
        fetchKey.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
    window.scrollTo(0, 0);
  }, [type, category]);

  const title = `${category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)} ${type === 'movie' ? 'Movies' : 'TV Shows'}`;

  if (loading) return <div className="loading-spinner">Loading {title}...</div>;

  return (
    <div className="genre-browse-container">
      <h1 className="section-title">{title}</h1>
      <div className="content-grid">
        {items.map(item => (
          <div key={item.id} style={{ width: '100%' }}>
            <MovieCard item={item} type={type} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
