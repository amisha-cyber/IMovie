import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService.js';
import { theatreService } from '../services/theatreService.js';
import { MovieCard } from '../components/movies/MovieCard.jsx';
import { TrailerModal } from '../components/movies/TrailerModal.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import {
  Play,
  Ticket,
  Sparkles,
  MapPin,
  Search,
  Star,
  Bookmark,
  Calendar,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Tv,
  Volume2,
  Armchair,
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';

export const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const navigate = useNavigate();

  // Next 4 dates for date pills
  const datePills = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayLabel = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dayLabel, dateFormatted, dateStr: d.toISOString().split('T')[0] };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [nowShowingRes, comingSoonRes, theatresRes] = await Promise.all([
          movieService.getMovies({ status: 'now_showing', limit: 8 }),
          movieService.getMovies({ status: 'coming_soon', limit: 4 }),
          theatreService.getTheatres()
        ]);

        const showingList = nowShowingRes.data || [];
        setNowShowing(showingList);
        setComingSoon(comingSoonRes.data || []);
        setTheatres(theatresRes.data || []);

        if (showingList.length > 0) {
          setFeaturedMovie(showingList[0]);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (homeSearch.trim()) {
      navigate(`/movies?search=${encodeURIComponent(homeSearch.trim())}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Curating cinema experiences..." />;
  }

  // Up next in hall items (excluding the active featured movie)
  const upNextMovies = nowShowing.filter(m => m._id !== featuredMovie?._id).slice(0, 3);

  return (
    <div className="position-relative overflow-hidden" style={{ minHeight: '100vh', background: 'var(--imv-canvas)' }}>
      {/* Top Ambient Glow Field (Stitch Specification) */}
      <div className="ambient-glow-crimson" style={{ top: '-100px', left: '20%' }} />
      <div className="ambient-glow-gold" style={{ top: '25%', right: '-80px' }} />

      <div className="container-xl position-relative z-1 py-4">
        {/* 1. Cinematic Hero Banner Carousel */}
        {featuredMovie && (
          <div
            className="position-relative w-100 rounded-4 overflow-hidden mb-5 shadow-2xl"
            style={{
              height: '620px',
              backgroundColor: 'var(--imv-surface-0)',
              border: '1px solid var(--imv-border)'
            }}
          >
            {/* Background Still Image with Zoom Hover */}
            <div
              className="position-absolute inset-0 w-100 h-100"
              style={{
                backgroundImage: `url(${featuredMovie.backdropUrl || featuredMovie.posterUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.85)'
              }}
            />

            {/* Scrim Gradients matching Stitch */}
            <div
              className="position-absolute inset-0 w-100 h-100"
              style={{
                background: 'linear-gradient(to top, #0B0C10 0%, rgba(11, 12, 16, 0.7) 45%, rgba(0, 0, 0, 0.2) 100%)'
              }}
            />
            <div
              className="position-absolute inset-0 w-100 h-100"
              style={{
                background: 'linear-gradient(to right, #0B0C10 0%, rgba(11, 12, 16, 0.8) 40%, transparent 100%)'
              }}
            />

            {/* Hero Content Overlay */}
            <div className="position-relative z-2 h-100 d-flex flex-column justify-content-end p-4 p-md-5 pb-5 col-lg-8">
              {/* Metadata Chips Row */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded label-caps fw-bold"
                  style={{
                    background: 'var(--imv-primary)',
                    color: '#fff',
                    boxShadow: '0 0 12px rgba(229, 9, 20, 0.5)'
                  }}
                >
                  FEATURED PREMIERE
                </span>
                <span
                  className="px-2.5 py-1 rounded label-caps text-white"
                  style={{ background: 'rgba(29, 31, 38, 0.85)', backdropFilter: 'blur(8px)' }}
                >
                  IMAX 3D
                </span>
                <span
                  className="px-2.5 py-1 rounded label-caps text-white"
                  style={{ background: 'rgba(29, 31, 38, 0.85)', backdropFilter: 'blur(8px)' }}
                >
                  Dolby Atmos
                </span>
                {featuredMovie.certification && (
                  <span
                    className="px-2 py-1 rounded label-caps"
                    style={{ background: 'rgba(29, 31, 38, 0.85)', color: 'var(--imv-text-muted)' }}
                  >
                    {featuredMovie.certification}
                  </span>
                )}
                {featuredMovie.duration && (
                  <span
                    className="px-2 py-1 rounded label-caps"
                    style={{ background: 'rgba(29, 31, 38, 0.85)', color: 'var(--imv-text-muted)' }}
                  >
                    {featuredMovie.duration} MIN
                  </span>
                )}
                {featuredMovie.rating && featuredMovie.rating > 0 && (
                  <div
                    className="d-flex align-items-center gap-1 px-2.5 py-1 rounded label-caps fw-bold"
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--imv-gold)',
                      border: '1px solid rgba(212, 175, 55, 0.3)'
                    }}
                  >
                    <Star size={13} className="fill-warning text-warning" />
                    <span>{featuredMovie.rating.toFixed(1)} AUDIENCE SCORE</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-display display-4 fw-extrabold text-white text-uppercase mb-2 text-shadow"
                style={{ letterSpacing: '-0.02em', lineHeight: '1.05' }}
              >
                {featuredMovie.title}
              </h1>

              {/* Synopsis */}
              <p
                className="lead mb-4 line-clamp-2"
                style={{ color: 'var(--imv-text-muted)', maxWidth: '640px', fontSize: '1.05rem' }}
              >
                {featuredMovie.synopsis}
              </p>

              {/* CTAs */}
              <div className="d-flex flex-wrap align-items-center gap-3">
                <Link
                  to={`/movies/${featuredMovie.slug || featuredMovie._id}`}
                  className="stitch-btn-primary px-4 py-3 text-decoration-none"
                  style={{ fontSize: '1rem' }}
                >
                  <Ticket size={20} />
                  <span>Book Tickets Now</span>
                </Link>

                {featuredMovie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setIsTrailerOpen(true)}
                    className="stitch-btn-secondary px-4 py-3"
                    style={{ fontSize: '1rem' }}
                  >
                    <Play size={20} style={{ color: 'var(--imv-primary)' }} />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Carousel Mini Thumbnails (Desktop Right Edge Float matching Stitch) */}
            {upNextMovies.length > 0 && (
              <div
                className="d-none d-xl-flex position-absolute bottom-0 end-0 m-4 z-3 flex-column gap-2 p-3 rounded-4 shadow-2xl"
                style={{
                  background: 'rgba(11, 12, 16, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--imv-border)',
                  width: '260px'
                }}
              >
                <span className="label-caps px-1" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                  Up Next in Hall
                </span>
                {upNextMovies.map((m) => (
                  <div
                    key={m._id}
                    onClick={() => setFeaturedMovie(m)}
                    className="d-flex align-items-center gap-2 p-2 rounded-3 cursor-pointer transition-all"
                    style={{
                      background: 'var(--imv-surface-container)',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--imv-border)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                  >
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="rounded"
                      style={{ width: '48px', height: '36px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="d-flex flex-column text-truncate">
                      <span className="font-display fw-bold text-white text-truncate small">
                        {m.title}
                      </span>
                      <span className="label-caps" style={{ color: 'var(--imv-gold)', fontSize: '9px' }}>
                        {m.rating ? `${m.rating.toFixed(1)} ★ • IMAX` : 'NOW SHOWING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Quick Filter Bar (Date & Format Hub - Stitch Spec) */}
        <div
          className="p-3 p-md-4 rounded-4 mb-5 shadow-xl d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3"
          style={{
            background: 'var(--imv-surface-container-low)',
            border: '1px solid var(--imv-border)'
          }}
        >
          {/* Date Selector Pills */}
          <div className="d-flex align-items-center gap-2 overflow-auto pb-1 pb-lg-0">
            {datePills.map((p, idx) => (
              <button
                key={p.dateStr}
                type="button"
                onClick={() => navigate(`/movies`)}
                className={`d-flex flex-column align-items-center justify-content-center px-3 py-2 rounded-3 border-0 transition-all ${
                  idx === 0 ? 'stitch-btn-primary' : 'stitch-btn-secondary'
                }`}
                style={{ minWidth: '95px' }}
              >
                <span className="label-caps" style={{ opacity: 0.85, fontSize: '10px' }}>
                  {p.dayLabel}
                </span>
                <span className="font-display fw-bold" style={{ fontSize: '14px' }}>
                  {p.dateFormatted}
                </span>
              </button>
            ))}
          </div>

          {/* Format / Experience Chips */}
          <div className="d-flex align-items-center gap-2 overflow-auto pb-1 pb-lg-0">
            <span className="d-none d-xl-inline label-caps me-1" style={{ color: 'var(--imv-text-muted)' }}>
              EXPERIENCE:
            </span>
            {['All', 'IMAX Laser', '4DX 3D', 'Dolby Cinema', 'VIP Lounge'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`filter-chip ${selectedFormat === fmt ? 'active' : ''}`}
              >
                {fmt === 'VIP Lounge' && <Star size={12} className="text-warning fill-warning" />}
                <span>{fmt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Now Showing Section */}
        <section className="mb-5">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="rounded-circle"
                  style={{
                    width: '9px',
                    height: '9px',
                    background: 'var(--imv-primary)',
                    boxShadow: '0 0 10px rgba(229, 9, 20, 0.8)'
                  }}
                />
                <span
                  className="label-caps fw-bold"
                  style={{ color: 'var(--imv-primary)', letterSpacing: '0.12em' }}
                >
                  AUDITORIUM FLAGSHIP NETWORK
                </span>
              </div>
              <h2 className="font-display fw-bold text-white mb-0" style={{ fontSize: '2rem' }}>
                Now Showing
              </h2>
            </div>
            <Link
              to="/movies?status=now_showing"
              className="d-flex align-items-center gap-1 text-decoration-none fw-bold small"
              style={{ color: 'var(--imv-primary)' }}
            >
              <span>Explore All Screenings</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {nowShowing.map((movie) => (
              <div key={movie._id} className="col">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>

        {/* 4. Curated Spotlight Banner / Membership (Stitch Spec) */}
        <section className="mb-5">
          <div
            className="position-relative rounded-4 overflow-hidden p-4 p-md-5 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0B0C10 0%, #13151B 50%, #1D1F26 100%)',
              border: '1px solid var(--imv-border)'
            }}
          >
            {/* Ambient Gold glow accent */}
            <div
              className="position-absolute top-0 end-0 rounded-circle pointer-events-none"
              style={{
                width: '380px',
                height: '380px',
                background: 'rgba(212, 175, 55, 0.08)',
                filter: 'blur(100px)'
              }}
            />

            <div className="position-relative z-1 row g-4 align-items-center">
              <div className="col-lg-8">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Sparkles size={18} style={{ color: 'var(--imv-gold)' }} />
                  <span
                    className="label-caps fw-bold"
                    style={{ color: 'var(--imv-gold)', letterSpacing: '0.12em' }}
                  >
                    TIER PRIVILEGE SPOTLIGHT
                  </span>
                </div>
                <h2 className="font-display fw-bold text-white mb-3" style={{ fontSize: '2rem' }}>
                  IMovies VIP Gold Club
                </h2>
                <p className="lead small mb-4" style={{ color: 'var(--imv-text-muted)', maxWidth: '640px' }}>
                  Elevate your cinematic rituals. Enjoy complimentary luxury upgrades on your birthday, zero online convenience booking fees, and 48-hour advance premiere reservations across our Mumbai and metro flagships.
                </p>
                <div className="d-flex flex-wrap align-items-center gap-4">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} style={{ color: 'var(--imv-gold)' }} />
                    <span className="small text-white">Private Bar Access</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} style={{ color: 'var(--imv-gold)' }} />
                    <span className="small text-white">Heated Recliner Upgrades</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} style={{ color: 'var(--imv-gold)' }} />
                    <span className="small text-white">Double Loyalty Stars</span>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 d-flex flex-column align-items-lg-end justify-content-center gap-2">
                <div className="text-lg-end">
                  <span className="label-caps" style={{ color: 'var(--imv-text-muted)' }}>
                    MEMBERSHIP PASS
                  </span>
                  <div className="font-display fs-3 fw-bold" style={{ color: 'var(--imv-gold)' }}>
                    ₹999 <span className="small text-muted" style={{ fontSize: '13px' }}>/ year</span>
                  </div>
                </div>
                <Link to="/register" className="stitch-btn-gold px-4 py-3 text-decoration-none">
                  Join VIP Club
                </Link>
                <span className="small" style={{ color: 'var(--imv-text-muted)', fontSize: '12px' }}>
                  Included with all premium subscriber tiers.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Coming Soon & Pre-Book Section */}
        {comingSoon.length > 0 && (
          <section className="mb-5">
            <div className="d-flex align-items-end justify-content-between mb-4">
              <div>
                <span className="label-caps fw-bold" style={{ color: 'var(--imv-gold)' }}>
                  TICKET PRE-SALE RADAR
                </span>
                <h2 className="font-display fw-bold text-white mb-0" style={{ fontSize: '2rem' }}>
                  Coming Soon & Pre-Book
                </h2>
              </div>
              <Link
                to="/movies?status=coming_soon"
                className="d-flex align-items-center gap-1 text-decoration-none fw-bold small"
                style={{ color: 'var(--imv-primary)' }}
              >
                <span>View All Upcoming</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="row g-4">
              {comingSoon.map((movie) => (
                <div key={movie._id} className="col-lg-6">
                  <div
                    className="p-3 rounded-4 h-100 d-flex flex-column flex-sm-row gap-3 shadow-lg"
                    style={{
                      background: 'var(--imv-surface-1)',
                      border: '1px solid var(--imv-border)'
                    }}
                  >
                    <div
                      className="position-relative rounded-3 overflow-hidden flex-shrink-0"
                      style={{
                        width: '160px',
                        height: '220px',
                        backgroundColor: 'var(--imv-surface-0)'
                      }}
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22160%22%20height%3D%22220%22%20fill%3D%22%2313151b%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23545b6e%22%20text-anchor%3D%22middle%22%20font-size%3D%2212%22%3EIMOVIES%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                      />
                      <div
                        className="position-absolute top-0 start-0 m-2 px-2 py-0.5 rounded label-caps fw-bold"
                        style={{
                          background: 'rgba(11, 12, 16, 0.9)',
                          color: 'var(--imv-gold)',
                          fontSize: '10px'
                        }}
                      >
                        PRE-SALE
                      </div>
                    </div>

                    <div className="d-flex flex-column justify-content-between flex-grow-1 py-1">
                      <div>
                        <div className="d-flex align-items-center justify-content-between label-caps mb-1 text-muted">
                          <span>WORLD PREMIERE</span>
                          <span style={{ color: 'var(--imv-gold)' }}>
                            {movie.releaseDate
                              ? new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'COMING SOON'}
                          </span>
                        </div>
                        <h4 className="font-display fw-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>
                          {movie.title}
                        </h4>
                        <p
                          className="small line-clamp-2 mb-3"
                          style={{ color: 'var(--imv-text-muted)' }}
                        >
                          {movie.synopsis}
                        </p>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <Link
                          to={`/movies/${movie.slug || movie._id}`}
                          className="stitch-btn-primary flex-grow-1 py-2 text-decoration-none small"
                        >
                          <Ticket size={16} />
                          <span>Pre-Book Seats</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Hall Specs Micro Banner (Experience Assurance - Stitch Spec) */}
        <section className="mb-5">
          <div
            className="row g-3 p-4 rounded-4 text-center"
            style={{
              background: 'var(--imv-surface-0)',
              border: '1px solid var(--imv-border)'
            }}
          >
            <div className="col-6 col-md-3 d-flex flex-column align-items-center">
              <Tv size={32} className="mb-2" style={{ color: 'var(--imv-primary)' }} />
              <h6 className="font-display fw-bold text-white mb-1">IMAX Laser 4K</h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Dual Laser Optical Projection
              </span>
            </div>
            <div className="col-6 col-md-3 d-flex flex-column align-items-center">
              <Volume2 size={32} className="mb-2" style={{ color: 'var(--imv-primary)' }} />
              <h6 className="font-display fw-bold text-white mb-1">Dolby Atmos</h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                128-Channel Spatial Acoustic Audio
              </span>
            </div>
            <div className="col-6 col-md-3 d-flex flex-column align-items-center">
              <Armchair size={32} className="mb-2" style={{ color: 'var(--imv-gold)' }} />
              <h6 className="font-display fw-bold text-white mb-1">Zero-G Recliners</h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Heated Italian Leather Loungers
              </span>
            </div>
            <div className="col-6 col-md-3 d-flex flex-column align-items-center">
              <UtensilsCrossed size={32} className="mb-2" style={{ color: 'var(--imv-gold)' }} />
              <h6 className="font-display fw-bold text-white mb-1">In-Seat Butler Dining</h6>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                Chef-Crafted Artisan Confectionery
              </span>
            </div>
          </div>
        </section>

        {/* 7. Premier Theatres Showcase (Authentic MongoDB Data) */}
        <section className="mb-5">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <MapPin size={16} style={{ color: 'var(--imv-primary)' }} />
                <span className="label-caps fw-bold" style={{ color: 'var(--imv-primary)' }}>
                  METROPOLITAN AUDITORIUMS
                </span>
              </div>
              <h2 className="font-display fw-bold text-white mb-0" style={{ fontSize: '2rem' }}>
                Our Premier Multiplexes
              </h2>
            </div>
            <Link
              to="/theatres"
              className="d-flex align-items-center gap-1 text-decoration-none fw-bold small"
              style={{ color: 'var(--imv-primary)' }}
            >
              <span>View All Theatres</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="row g-4">
            {theatres.map((theatre) => (
              <div key={theatre._id} className="col-md-4">
                <div
                  className="p-4 rounded-4 h-100 d-flex flex-column justify-content-between shadow-sm"
                  style={{
                    background: 'var(--imv-surface-1)',
                    border: '1px solid var(--imv-border)'
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="label-caps" style={{ color: 'var(--imv-gold)' }}>
                        {theatre.city}, {theatre.state}
                      </span>
                      <span
                        className="badge px-2 py-0.5 label-caps"
                        style={{
                          background: 'rgba(229, 9, 20, 0.15)',
                          color: 'var(--imv-primary)',
                          border: '1px solid rgba(229, 9, 20, 0.3)'
                        }}
                      >
                        {theatre.screenCount || 2} SCREENS
                      </span>
                    </div>
                    <h5 className="font-display fw-bold text-white mb-2">
                      {theatre.name}
                    </h5>
                    <p className="small mb-3" style={{ color: 'var(--imv-text-muted)' }}>
                      {theatre.address}
                    </p>
                  </div>

                  <div className="pt-3 border-top" style={{ borderColor: 'var(--imv-border)' }}>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {(theatre.amenities || []).slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded label-caps"
                          style={{
                            background: 'var(--imv-surface-container)',
                            color: 'var(--imv-text-muted)',
                            fontSize: '10px'
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/movies"
                      className="stitch-btn-secondary w-100 py-2 text-decoration-none small"
                    >
                      Browse Showtimes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trailer Modal */}
        {featuredMovie && (
          <TrailerModal
            isOpen={isTrailerOpen}
            onClose={() => setIsTrailerOpen(false)}
            trailerUrl={featuredMovie.trailerUrl}
            movieTitle={featuredMovie.title}
          />
        )}
      </div>
    </div>
  );
};
