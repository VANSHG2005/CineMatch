import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const PAGE_SIZE = 20;

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
      <label>Show</label>
      <select value={filters.show} onChange={e => onChange({ ...filters, show: e.target.value })}>
        <option value="all">All</option>
        <option value="movies">Movies Only</option>
        <option value="tv">TV Only</option>
      </select>
    </div>
    <div className="filter-group">
      <label>Sort By</label>
      <select value={filters.sort} onChange={e => onChange({ ...filters, sort: e.target.value })}>
        <option value="">Default</option>
        <option value="rating_desc">Rating ↓</option>
        <option value="year_desc">Newest First</option>
        <option value="title_asc">Title A–Z</option>
      </select>
    </div>
    {(filters.year || filters.rating || filters.sort || filters.show !== 'all') && (
      <button className="filter-clear-btn" onClick={() => onChange({ year: '', rating: '', sort: '', show: 'all' })}>
        <i className="fas fa-xmark"></i> Clear
      </button>
    )}
  </div>
);

const applyFilters = (arr, filters, dateKey) => {
  let result = [...arr];
  if (filters.year) result = result.filter(i => (i[dateKey] || '').startsWith(filters.year));
  if (filters.rating) result = result.filter(i => (i.vote_average || 0) >= parseFloat(filters.rating));
  if (filters.sort === 'rating_desc') result.sort((a, b) => b.vote_average - a.vote_average);
  else if (filters.sort === 'year_desc') result.sort((a, b) => ((b[dateKey] || '') > (a[dateKey] || '') ? 1 : -1));
  else if (filters.sort === 'title_asc') result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
  return result;
};

const GenrePage = () => {
  const { type, id } = useParams();
  const [data, setData] = useState({ genre_name: '', movies: [], tv_shows: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({ year: '', rating: '', sort: '', show: 'all' });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const fetchKey = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const key = `${type}-${id}`;
    if (fetchKey.current === key) return;
    fetchKey.current = key;
    setVisibleCount(PAGE_SIZE);

    const fetchGenreContent = async () => {
      setLoading(true);
      try {
        const response = await tmdbApi.getGenreContent(type, id);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching genre content:', error);
        fetchKey.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchGenreContent();
    window.scrollTo(0, 0);
  }, [type, id]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filters]);

  const filteredMovies = useMemo(() => applyFilters(data.movies, filters, 'release_date'), [data.movies, filters]);
  const filteredTv = useMemo(() => applyFilters(data.tv_shows, filters, 'first_air_date'), [data.tv_shows, filters]);

  const showMovies = filters.show !== 'tv';
  const showTv = filters.show !== 'movies';

  // Combine for unified pagination
  const allFiltered = useMemo(() => {
    const movies = showMovies ? filteredMovies.map(m => ({ ...m, _type: 'movie' })) : [];
    const tv = showTv ? filteredTv.map(t => ({ ...t, _type: 'tv' })) : [];
    return [...movies, ...tv];
  }, [filteredMovies, filteredTv, showMovies, showTv]);

  const visible = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(c => c + PAGE_SIZE);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (loading) return <div className="loading-spinner">Loading {data.genre_name || 'Genre'}...</div>;

  // Split visible back into movies vs tv for section headers
  const visibleMovies = visible.filter(i => i._type === 'movie');
  const visibleTv = visible.filter(i => i._type === 'tv');

  return (
    <div className="genre-browse-container">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>{data.genre_name}</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {visible.length} / {allFiltered.length} titles
        </span>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {allFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="fas fa-filter" style={{ fontSize: '2rem', marginBottom: '15px', display: 'block' }}></i>
          No results match your filters.
        </div>
      ) : (
        <>
          {visibleMovies.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h2 className="section-title" style={{ borderLeftColor: '#e50914' }}>
                Movies <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>({filteredMovies.length})</span>
              </h2>
              <div className="small-card-grid">
                {visibleMovies.map(movie => <MovieCard key={movie.id} item={movie} type="movie" />)}
              </div>
            </section>
          )}

          {visibleTv.length > 0 && (
            <section>
              <h2 className="section-title" style={{ borderLeftColor: '#00c853' }}>
                TV Shows <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)' }}>({filteredTv.length})</span>
              </h2>
              <div className="small-card-grid">
                {visibleTv.map(show => <MovieCard key={show.id} item={show} type="tv" />)}
              </div>
            </section>
          )}

          <div ref={sentinelRef} style={{ height: '1px' }} />
          {loadingMore && (
            <div className="infinite-scroll-loader">
              <i className="fas fa-spinner fa-spin"></i> Loading more...
            </div>
          )}
          {!hasMore && allFiltered.length > PAGE_SIZE && (
            <div className="infinite-scroll-end">
              All {allFiltered.length} titles loaded
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenrePage;