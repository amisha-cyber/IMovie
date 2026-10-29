import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theatreService } from '../../services/theatreService.js';

export const ShowModal = ({ isOpen, onClose, onSave, movies, theatres }) => {
  const [formData, setFormData] = useState({
    movie: '',
    theatre: '',
    screen: '',
    startTime: '',
    basePrice: 200,
    silverPrice: 200,
    goldPrice: 260,
    platinumPrice: 360
  });

  const [screens, setScreens] = useState([]);

  useEffect(() => {
    if (theatres && theatres.length > 0 && !formData.theatre) {
      setFormData((prev) => ({ ...prev, theatre: theatres[0]._id }));
    }
    if (movies && movies.length > 0 && !formData.movie) {
      setFormData((prev) => ({ ...prev, movie: movies[0]._id }));
    }
  }, [theatres, movies]);

  useEffect(() => {
    if (formData.theatre) {
      theatreService.getScreens(formData.theatre).then((res) => {
        setScreens(res.data || []);
        if (res.data?.length > 0) {
          setFormData((prev) => ({ ...prev, screen: res.data[0]._id }));
        }
      });
    }
  }, [formData.theatre]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      movie: formData.movie,
      theatre: formData.theatre,
      screen: formData.screen,
      startTime: new Date(formData.startTime).toISOString(),
      basePrice: Number(formData.basePrice),
      seatPricing: {
        silver: Number(formData.silverPrice),
        gold: Number(formData.goldPrice),
        platinum: Number(formData.platinumPrice)
      }
    };
    onSave(payload);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark border-secondary border-opacity-50 text-light shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-secondary border-opacity-25 py-3">
            <h5 className="modal-title fw-bold">Schedule Movie Show</h5>
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 row g-3">
              <div className="col-12">
                <label className="form-label small text-muted">Movie *</label>
                <select
                  required
                  className="form-select bg-black border-secondary text-light"
                  value={formData.movie}
                  onChange={(e) => setFormData({ ...formData, movie: e.target.value })}
                >
                  <option value="">Select a movie</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>{m.title} ({m.duration}m)</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Theatre *</label>
                <select
                  required
                  className="form-select bg-black border-secondary text-light"
                  value={formData.theatre}
                  onChange={(e) => setFormData({ ...formData, theatre: e.target.value })}
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted">Screen *</label>
                <select
                  required
                  className="form-select bg-black border-secondary text-light"
                  value={formData.screen}
                  onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                >
                  {screens.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.totalSeats} seats)</option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label small text-muted">Show Date & Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-muted">Silver Price (₹)</label>
                <input
                  type="number"
                  min={50}
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.silverPrice}
                  onChange={(e) => setFormData({ ...formData, silverPrice: e.target.value, basePrice: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-muted">Gold Price (₹)</label>
                <input
                  type="number"
                  min={50}
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.goldPrice}
                  onChange={(e) => setFormData({ ...formData, goldPrice: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-muted">Platinum Price (₹)</label>
                <input
                  type="number"
                  min={50}
                  required
                  className="form-control bg-black border-secondary text-light"
                  value={formData.platinumPrice}
                  onChange={(e) => setFormData({ ...formData, platinumPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer border-secondary border-opacity-25 p-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-cinema btn-sm px-4">
                Schedule Show
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
