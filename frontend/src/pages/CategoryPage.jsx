import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { tmdbApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);
const PAGE_SIZE = 20; // items shown per "page" of infinite scroll

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
  const [allItems, setAllItems] = useState([]);   // all fetched from API
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); // how many rendered
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({ year: '', rating: '', sort: '' });
  const fetchKey = useRef(null);
  const sentinelRef = useRef(null); // bottom sentinel for IntersectionObserver

  // Fetch all items once per category
  useEffect(() => {
    const key = `${type}-${category}`;
    if (fetchKey.current === key) return;
    fetchKey.current = key;
    setVisibleCount(PAGE_SIZE);

    const fetchCategory = async () => {
      setLoading(true);
      try {
        // Fetch multiple pages in parallel to have a good pool of items
        const pages = await Promise.all(
          [1, 2, 3, 4, 5].map(page =>
            type === 'movie'
              ? tmdbApi.getMoviesByCategory(category, page)
              : tmdbApi.getTvByCategory(category, page)
          )
        );
        const combined = pages.flatMap(r => r.data || []);
        // Deduplicate by id
        const seen = new Set();
        const unique = combined.filter(i => {
          if (seen.has(i.id)) return false;
          seen.add(i.id);
          return true;
        });
        setAllItems(unique);
      } catch (error) {
        console.error('Error fetching category items:', error);
        fetchKey.current = null;
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
    window.scrollTo(0, 0);
  }, [type, category]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [filters]);

  // Apply filters + sort to all items
  const filtered = useMemo(() => {
    let result = [...allItems];
    if (filters.year) result = result.filter(i => (i.release_date || i.first_air_date || '').startsWith(filters.year));
    if (filters.rating) result = result.filter(i => (i.vote_average || 0) >= parseFloat(filters.rating));
    if (filters.sort === 'rating_desc') result.sort((a, b) => b.vote_average - a.vote_average);
    else if (filters.sort === 'rating_asc') result.sort((a, b) => a.vote_average - b.vote_average);
    else if (filters.sort === 'year_desc') result.sort((a, b) => ((b.release_date || b.first_air_date || '') > (a.release_date || a.first_air_date || '') ? 1 : -1));
    else if (filters.sort === 'year_asc') result.sort((a, b) => ((a.release_date || a.first_air_date || '') > (b.release_date || b.first_air_date || '') ? 1 : -1));
    else if (filters.sort === 'title_asc') result.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    return result;
  }, [allItems, filters]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // IntersectionObserver — load more when sentinel enters viewport
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

  const title = `${category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ${type === 'movie' ? 'Movies' : 'TV Shows'}`;

  if (loading) return <div className="loading-spinner">Loading {title}...</div>;

  return (
    <div className="genre-browse-container">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h1 className="section-title" style={{ margin: 0 }}>{title}</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {visible.length} / {filtered.length} titles
        </span>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <i className="fas fa-filter" style={{ fontSize: '2rem', marginBottom: '15px', display: 'block' }}></i>
          No results match your filters.
        </div>
      ) : (
        <>
          <div className="small-card-grid">
            {visible.map(item => <MovieCard key={item.id} item={item} type={type} />)}
          </div>

          {/* Sentinel + loader */}
          <div ref={sentinelRef} style={{ height: '1px' }} />
          {loadingMore && (
            <div className="infinite-scroll-loader">
              <i className="fas fa-spinner fa-spin"></i> Loading more...
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <div className="infinite-scroll-end">
              All {filtered.length} titles loaded
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;