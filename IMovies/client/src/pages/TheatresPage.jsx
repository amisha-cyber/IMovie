import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { theatreService } from '../services/theatreService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { MapPin, Film, Sparkles, Tv } from 'lucide-react';

const CITIES = ['All', 'Mumbai', 'New Delhi', 'Bengaluru'];

export const TheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedCity !== 'All') params.city = selectedCity;
        const res = await theatreService.getTheatres(params);
        setTheatres(res.data || []);
      } catch (err) {
        console.error('Failed to load theatres:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTheatres();
  }, [selectedCity]);

  return (
    <div style={{ background: 'var(--imv-canvas)', minHeight: '100vh' }}>
      {/* Header Banner */}
      <section
        className="w-100 py-5 border-bottom"
        style={{
          background: 'linear-gradient(180deg, #13151B 0%, #0B0C10 100%)',
          borderColor: 'var(--imv-border)'
        }}
      >
        <div className="container-xl">
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
              FLAGSHIP AUDITORIUM DIRECTORY
            </span>
          </div>
          <h1 className="font-display display-5 fw-extrabold text-white mb-2">
            Premier Multiplexes
          </h1>
          <p className="lead small mb-4" style={{ color: 'var(--imv-text-muted)', maxWidth: '640px' }}>
            Discover our premier auditoriums equipped with IMAX 4K Laser, 4DX motion, and Dolby Atmos across major metropolitan cities.
          </p>

          {/* City Filter Chips */}
          <div className="d-flex gap-2 flex-wrap">
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                className={`filter-chip ${selectedCity === city ? 'active' : ''}`}
                onClick={() => setSelectedCity(city)}
              >
                <MapPin size={13} />
                <span>{city}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Theatres Grid */}
      <div className="container-xl py-5">
        {loading ? (
          <LoadingSpinner message="Finding cinema locations..." />
        ) : (
          <div className="row g-4">
            {theatres.map((theatre) => (
              <div key={theatre._id} className="col-lg-4 col-md-6">
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

                    <h4 className="font-display fw-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>
                      {theatre.name}
                    </h4>
                    <p className="small mb-3" style={{ color: 'var(--imv-text-muted)' }}>
                      {theatre.description || theatre.address}
                    </p>

                    <div className="mb-3">
                      <div className="label-caps mb-2" style={{ color: 'var(--imv-text-muted)', fontSize: '10px' }}>
                        HALL SPECIFICATIONS
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {(theatre.amenities || []).map((amenity, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded label-caps"
                            style={{
                              background: 'var(--imv-surface-container)',
                              color: 'var(--imv-text-med)',
                              fontSize: '10px'
                            }}
                          >
                            <Sparkles size={10} className="me-1 text-warning" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-top" style={{ borderColor: 'var(--imv-border)' }}>
                    <Link
                      to="/movies"
                      className="stitch-btn-primary w-100 py-2.5 text-decoration-none small"
                    >
                      <Film size={16} />
                      <span>View Scheduled Shows</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
