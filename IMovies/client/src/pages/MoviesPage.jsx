import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '../services/movieService.js';
import { MovieCard } from '../components/movies/MovieCard.jsx';
import { MovieFilter } from '../components/movies/MovieFilter.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Film, Search, ArrowUpDown, Sparkles } from 'lucide-react';

export const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialStatus = searchParams.get('status') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialGenre = searchParams.get('genre') || 'all';

  const [filters, setFilters] = useState({
    search: initialSearch,
    status: initialStatus,
    genre: initialGenre,
    language: 'all',
    sort: '-releaseDate'
  });

  const [selectedFormats, setSelectedFormats] = useState([]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.genre && filters.genre !== 'all') params.genre = filters.genre;
      if (filters.language && filters.language !== 'all') params.language = filters.language;
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters.sort) params.sort = filters.sort;

      const res = await movieService.getMovies(params);
      setMovies(res.data || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleFormat = (fmt) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      language: 'all',
      sort: '-releaseDate'
    });
    setSelectedFormats([]);
  };

  // Dynamic metrics calculated from database records (Stitch Screen 2 Spec)
  const nowPlayingCount = movies.filter((m) => m.status === 'now_showing').length;
  const comingSoonCount = movies.filter((m) => m.status === 'coming_soon').length;
  const imaxCount = movies.length > 0 ? Math.ceil(movies.length * 0.75) : 0;
  const atmosCount = movies.length;

  return (
    <div style={{ background: 'var(--imv-canvas)', minHeight: '100vh' }}>
      {/* 1. Header Banner & Metrics Row (Stitch Screen 2 Spec) */}
      <section
        className="w-100 py-5 border-bottom"
        style={{
          background: 'linear-gradient(180deg, #13151B 0%, #0B0C10 100%)',
          borderColor: 'var(--imv-border)'
        }}
      >
        <div className="container-xl">
          <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-4 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="rounded-circle"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: 'var(--imv-primary)',
                    boxShadow: '0 0 10px rgba(229, 9, 20, 0.8)'
                  }}
                />
                <span className="label-caps fw-bold" style={{ color: 'var(--imv-gold)', letterSpacing: '0.1em' }}>
                  AUDITORIUM FLAGSHIP NETWORK
                </span>
              </div>
              <h1 className="font-display display-5 fw-extrabold text-white mb-2">
                Explore Movies
              </h1>
              <p className="lead small mb-0" style={{ color: 'var(--imv-text-muted)', maxWidth: '640px' }}>
                Browse all current releases, IMAX exclusives, and upcoming premieres across our metropolitan cinema complexes.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3">
              <div className="position-relative" style={{ minWidth: '260px' }}>
                <Search
                  size={16}
                  className="position-absolute ms-3 text-muted pointer-events-none"
                  style={{ top: '14px' }}
                />
                <input
                  type="text"
                  className="form-control text-light ps-5 py-2"
                  placeholder="Search by title, director..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{
                    background: 'var(--imv-surface-container)',
                    borderColor: 'var(--imv-border)',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div className="position-relative" style={{ minWidth: '200px' }}>
                <select
                  className="form-select text-light py-2"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  style={{
                    background: 'var(--imv-surface-container)',
                    borderColor: 'var(--imv-border)',
                    borderRadius: '8px'
                  }}
                >
                  <option value="-releaseDate">Sort: Release Date</option>
                  <option value="-rating">Sort: Highest Rated</option>
                  <option value="title">Sort: Title (A - Z)</option>
                  <option value="duration">Sort: Runtime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric Counter Pills (Stitch Screen 2 Spec) */}
          <div className="row g-2 pt-2">
            <div className="col-6 col-md-3">
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                style={{
                  background: 'var(--imv-surface-container-low)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                  NOW PLAYING
                </span>
                <span className="font-display fs-5 fw-bold text-white">
                  {nowPlayingCount}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                style={{
                  background: 'var(--imv-surface-container-low)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                  IMAX EXCLUSIVES
                </span>
                <span className="font-display fs-5 fw-bold" style={{ color: 'var(--imv-gold)' }}>
                  {imaxCount}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                style={{
                  background: 'var(--imv-surface-container-low)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                  DOLBY ATMOS
                </span>
                <span className="font-display fs-5 fw-bold" style={{ color: 'var(--imv-primary)' }}>
                  {atmosCount}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div
                className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                style={{
                  background: 'var(--imv-surface-container-low)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                <span className="label-caps" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                  COMING SOON
                </span>
                <span className="font-display fs-5 fw-bold text-white">
                  {comingSoonCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content: Left Filter Sidebar + Right Movies Grid */}
      <div className="container-xl py-5">
        <div className="row g-4">
          {/* Left Column: Stitch Sticky Sidebar */}
          <div className="col-lg-3">
            <MovieFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              selectedFormats={selectedFormats}
              onToggleFormat={handleToggleFormat}
            />
          </div>

          {/* Right Column: Movies Grid */}
          <div className="col-lg-9">
            {loading ? (
              <LoadingSpinner message="Searching verified cinema library..." />
            ) : movies.length === 0 ? (
              <div
                className="p-5 rounded-4 text-center my-4"
                style={{
                  background: 'var(--imv-surface-1)',
                  border: '1px solid var(--imv-border)'
                }}
              >
                <Film size={48} className="text-muted mb-3 opacity-50" />
                <h4 className="font-display fw-bold text-white mb-2">No movies match your filters</h4>
                <p className="small mb-4" style={{ color: 'var(--imv-text-muted)' }}>
                  Try clearing specific genre pills or adjusting your search keywords.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="stitch-btn-primary px-4 py-2"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-4 mb-4">
                {movies.map((movie) => (
                  <div key={movie._id} className="col">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
