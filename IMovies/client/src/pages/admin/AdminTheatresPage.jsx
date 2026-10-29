import React, { useState, useEffect } from 'react';
import { theatreService } from '../../services/theatreService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Plus, Clapperboard, MapPin, Sparkles, Trash2, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminTheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All');

  // New Theatre Modal State
  const [isTheatreModalOpen, setIsTheatreModalOpen] = useState(false);
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    amenities: 'Dolby Atmos, 4K Laser, Recliners, Food Court'
  });

  // New Screen Modal State
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [selectedTheatreId, setSelectedTheatreId] = useState(null);
  const [screenForm, setScreenForm] = useState({
    name: 'Audi 3',
    screenType: 'Dolby Atmos'
  });

  const fetchTheatres = async (showToast = false) => {
    try {
      if (theatres.length === 0) setLoading(true);
      else setRefreshing(true);

      const res = await theatreService.getTheatres();
      setTheatres(res.data || []);
      if (showToast) {
        toast.success('Cinema complexes refreshed from database.');
      }
    } catch (err) {
      toast.error('Failed to load theatres.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...theatreForm,
        amenities: theatreForm.amenities.split(',').map((a) => a.trim()).filter(Boolean)
      };
      await theatreService.createTheatre(payload);
      toast.success('Theatre added successfully.');
      setIsTheatreModalOpen(false);
      setTheatreForm({
        name: '',
        address: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        amenities: 'Dolby Atmos, 4K Laser, Recliners, Food Court'
      });
      fetchTheatres();
    } catch (err) {
      toast.error(err.message || 'Failed to create theatre.');
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    try {
      await theatreService.createScreen(selectedTheatreId, screenForm);
      toast.success('Screen created with standard 60-seat layout.');
      setIsScreenModalOpen(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.message || 'Failed to create screen.');
    }
  };

  const handleDeleteTheatre = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} and its screens?`)) return;
    try {
      await theatreService.deleteTheatre(id);
      toast.success('Theatre deleted.');
      fetchTheatres();
    } catch (err) {
      toast.error('Failed to delete theatre.');
    }
  };

  // Filter theatres by city
  const filteredTheatres = selectedCity === 'All'
    ? theatres
    : theatres.filter((t) => (t.city || '').toLowerCase() === selectedCity.toLowerCase());

  // Distinct cities from actual database records
  const cities = ['All', ...new Set(theatres.map((t) => t.city).filter(Boolean))];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-light mb-0">Theatres & Screens</h2>
            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1 small">
              {theatres.length} Active
            </span>
          </div>
          <p className="text-muted small mb-0">Manage cinema complexes, auditoriums, and screen seating layouts</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => fetchTheatres(true)}
            disabled={refreshing}
            id="refresh-theatres-btn"
          >
            <RefreshCw size={14} className={refreshing ? 'spinner-border spinner-border-sm' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            className="btn btn-cinema d-flex align-items-center gap-2"
            onClick={() => setIsTheatreModalOpen(true)}
            id="add-new-theatre-btn"
          >
            <Plus size={18} /> Add New Theatre
          </button>
        </div>
      </div>

      {/* City Filters */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {cities.map((city) => {
          const count = city === 'All'
            ? theatres.length
            : theatres.filter((t) => (t.city || '').toLowerCase() === city.toLowerCase()).length;

          return (
            <button
              key={city}
              type="button"
              className={`btn btn-sm px-3 rounded-pill border d-flex align-items-center gap-1 ${
                selectedCity === city
                  ? 'btn-danger text-light border-danger'
                  : 'btn-dark text-muted border-secondary border-opacity-50'
              }`}
              onClick={() => setSelectedCity(city)}
            >
              <span>{city}</span>
              <span className={`badge ${selectedCity === city ? 'bg-black text-light' : 'bg-secondary bg-opacity-50 text-light'}`} style={{ fontSize: '0.68rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && theatres.length === 0 ? (
        <LoadingSpinner message="Loading cinema complexes from database..." />
      ) : filteredTheatres.length === 0 ? (
        <div className="bg-dark p-5 rounded-4 border border-secondary border-opacity-25 text-center">
          <Clapperboard size={48} className="text-muted mb-3 opacity-50" />
          <h5 className="fw-bold text-light mb-1">No cinema complexes found for {selectedCity}</h5>
          <p className="text-muted small mb-3">Add a new cinema complex or select another city filter.</p>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setSelectedCity('All')}
          >
            View All Cities
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {filteredTheatres.map((t) => {
            const screenCount = t.screenCount ?? (t.screens ? t.screens.length : 0);

            return (
              <div key={t._id} className="col-lg-6">
                <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between shadow-sm">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-2 py-1 small">
                            <MapPin size={12} className="me-1" /> {t.city}{t.state ? `, ${t.state}` : ''}
                          </span>
                          <span className="badge bg-secondary bg-opacity-25 text-light small">
                            {screenCount} Screen{screenCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        <h4 className="fw-bold text-light mb-1">{t.name}</h4>
                        <p className="text-muted small mb-3">{t.address}</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1"
                        onClick={() => handleDeleteTheatre(t._id, t.name)}
                        title="Delete Theatre"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-3">
                      <div className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.7rem' }}>
                        Amenities
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {(t.amenities || []).map((a, i) => (
                          <span key={i} className="badge bg-black border border-secondary text-secondary" style={{ fontSize: '0.72rem' }}>
                            <Sparkles size={10} className="text-warning me-1" />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-top border-secondary border-opacity-25 pt-3 mt-3 d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      <strong className="text-light">{screenCount}</strong> Auditorium{screenCount === 1 ? '' : 's'} Configured
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                      onClick={() => {
                        setSelectedTheatreId(t._id);
                        setIsScreenModalOpen(true);
                      }}
                    >
                      <Plus size={14} /> Add Screen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Theatre Modal */}
      {isTheatreModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4 overflow-hidden">
              <div className="modal-header border-secondary py-3">
                <h5 className="modal-title fw-bold">Add New Cinema Complex</h5>
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={() => setIsTheatreModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTheatre}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Theatre Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-black border-secondary text-light"
                      placeholder="e.g. IMovies Premier Palladium"
                      value={theatreForm.name}
                      onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted">City *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-black border-secondary text-light"
                        placeholder="Mumbai"
                        value={theatreForm.city}
                        onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted">State *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-black border-secondary text-light"
                        placeholder="Maharashtra"
                        value={theatreForm.state}
                        onChange={(e) => setTheatreForm({ ...theatreForm, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Full Address *</label>
                    <textarea
                      required
                      rows={2}
                      className="form-control bg-black border-secondary text-light"
                      placeholder="e.g. High Street Phoenix, Lower Parel"
                      value={theatreForm.address}
                      onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Amenities (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control bg-black border-secondary text-light"
                      placeholder="Dolby Atmos, 4K Laser, Recliners, Food Court"
                      value={theatreForm.amenities}
                      onChange={(e) => setTheatreForm({ ...theatreForm, amenities: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsTheatreModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema btn-sm px-4">
                    Create Theatre
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Screen Modal */}
      {isScreenModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4 overflow-hidden">
              <div className="modal-header border-secondary py-3">
                <h5 className="modal-title fw-bold">Add Screen Auditorium</h5>
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={() => setIsScreenModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateScreen}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Screen Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-black border-secondary text-light"
                      placeholder="e.g. Audi 1 - Laser IMAX"
                      value={screenForm.name}
                      onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted">Screen Type</label>
                    <select
                      className="form-select bg-black border-secondary text-light"
                      value={screenForm.screenType}
                      onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                    >
                      <option value="Dolby Atmos">Dolby Atmos</option>
                      <option value="IMAX">IMAX Laser</option>
                      <option value="4DX">4DX Motion</option>
                      <option value="Standard">Standard Digital</option>
                    </select>
                  </div>

                  <div className="alert alert-info py-2 px-3 small border-0 bg-info bg-opacity-10 text-info">
                    Screens are initialized with a standard 60-seat layout (Rows A–F with Silver, Gold, and Platinum pricing tiers).
                  </div>
                </div>

                <div className="modal-footer border-secondary py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsScreenModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema btn-sm px-4">
                    Create Screen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
