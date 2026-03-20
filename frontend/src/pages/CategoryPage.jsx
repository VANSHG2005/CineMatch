import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const FilterBar = ({ filters, onChange }) => (
  <div className="filter-bar">
    <div className="filter-group">
      <label>Year</label>
      <select value={filters.year} onChange={e => onChange({ ...filters, year: e.target.value })}>
        <option value="">All Years</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
    <div className="filter-group">
      <label>Min Rating</label>
      <select value={filters.rating} onChange={e => onChange({ ...filters, rating: e.target.value })}>
        <option value="">Any Rating</option>
        <option value="9">9+</option>
        <option value="8">8+</option>
        <option value="7">7+</option>
        <option value="6">6+</option>
        <option value="5">5+</option>
      </select>
    </div>
    <div className="filter-group">
      <label>Sort By</label>
      <select value={filters.sort} onChange={e => onChange({ ...filters, sort: e.target.value })}>
        <option value="">Default</option>
        <option value="rating_desc">Rating ↓</option>
        <option value="rating_asc">Rating ↑</option>
        <option value="year_desc">Newest First</option>
        <option value="year_asc">Oldest First</option>
        <option value="title_asc">Title A–Z</option>
      </select>
    </div>
    {(filters.year || filters.rating || filters.sort) && (
      <button className="filter-clear-btn" onClick={() => onChange({ year: '', rating: '', sort: '' })}>
        <i className="fas fa-xmark"></i> Clear
      </button>
    )}
  </div>
);

const CategoryPage = () => {
  const { type, category } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', rating: '', sort: '' });
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

  const filtered = useMemo(() => {
    let result = [...items];
    if (filters.year) {
      result = result.filter(i => {
        const date = i.release_date || i.first_air_date || '';
        return date.startsWith(filters.year);
      });
    }
    if (filters.rating) {
      result = result.filter(i => (i.vote_average || 0) >= parseFloat(filters.rating));
    }
    if (filters.sort === 'rating_desc') result.sort((a, b) => b.vote_average - a.vote_average);
    else if (filters.sort === 'rating_asc') result.sort((a, b) => a.vote_average - b.vote_average);
    else if (filters.sort === 'year_desc') result.sort((a, b) => ((b.release_date || b.first_air_date || '') > (a.release_date || a.first_air_date || '') ? 1 : -1));
    else if (filters.sort === 'year_asc') result.sort((a, b) => ((a.release_date || a.first_air_date || '') > (b.release_date || b.first_air_date || '') ? 1 : -1));
    else if (filters.sort === 'title_asc') result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    return result;
  }, [items, filters]);

  const title = `${category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ${type === 'movie' ? 'Movies' : 'TV Shows'}`;

  if (loading) return <div className="loading-spinner">Loading {title}...</div>;

  return (
    <div className="genre-browse-container">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>{title}</h1>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>{filtered.length} titles</span>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <i className="fas fa-filter" style={{ fontSize: '2rem', marginBottom: '15px', display: 'block' }}></i>
          No results match your filters.
        </div>
      ) : (
        <div className="small-card-grid">
          {filtered.map(item => (
            <MovieCard key={item.id} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;