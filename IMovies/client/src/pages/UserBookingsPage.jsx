import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const UserBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      toast.error('Failed to load bookings history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId, bookingRef) => {
    const confirm = window.confirm(`Are you sure you want to cancel booking ${bookingRef}? Seats will be released and eligible refund processed.`);
    if (!confirm) return;

    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId, { reason: 'User requested cancellation from dashboard' });
      toast.success(`Booking ${bookingRef} cancelled successfully. Refund initiated.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your bookings..." />;
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">My Bookings</h1>
        <p className="text-muted small">
          View your confirmed movie tickets, access QR passes, or manage cancellations
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-dark p-5 rounded-4 border border-secondary border-opacity-25 text-center my-4">
          <Ticket size={48} className="text-muted mb-3 opacity-50" />
          <h4 className="fw-bold mb-2">No bookings yet</h4>
          <p className="text-muted small mb-3">
            You haven't reserved any movie tickets yet. Explore currently showing movies and book your seats!
          </p>
          <Link to="/movies" className="btn btn-cinema btn-sm">
            Browse Movies Now
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {bookings.map((b) => {
            const show = b.show || {};
            const movie = show.movie || {};
            const theatre = show.theatre || {};
            const isConfirmed = b.status === 'confirmed';
            const isCancelled = b.status === 'cancelled';
            const isExpired = b.status === 'expired' || b.status === 'pending';

            // Check if cancellation cutoff has passed (2 hours prior)
            const showTimeMs = new Date(show.startTime).getTime();
            const hoursLeft = (showTimeMs - Date.now()) / (1000 * 60 * 60);
            const canCancel = isConfirmed && hoursLeft >= 2;

            return (
              <div
                key={b._id}
                className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm"
              >
                <div className="row g-3 align-items-center">
                  {/* Poster Thumbnail */}
                  <div className="col-sm-3 col-md-2 text-center text-sm-start">
                    <img
                      src={movie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80'}
                      alt={movie.title}
                      className="img-fluid rounded-3 border border-secondary border-opacity-50"
                      style={{ maxHeight: '130px', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div className="col-sm-9 col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-black border border-secondary text-secondary font-monospace">
                        {b.bookingReference}
                      </span>
                      <span
                        className={`badge ${
                          isConfirmed ? 'bg-success' : isCancelled ? 'bg-danger' : 'bg-warning text-dark'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="fw-bold text-light mb-1">{movie.title || 'Movie Title'}</h4>

                    <div className="d-flex flex-wrap gap-3 text-muted small mb-2">
                      <span className="d-flex align-items-center gap-1">
                        <Calendar size={14} /> {new Date(show.startTime).toLocaleDateString()}
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={14} /> {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <MapPin size={14} className="text-danger" /> {theatre.name}
                      </span>
                    </div>

                    <div className="small">
                      <span className="text-muted">Seats: </span>
                      <strong className="text-light">
                        {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </strong>
                      <span className="text-muted ms-3">Total Paid: </span>
                      <strong className="text-danger">₹{b.grandTotal}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-md-4 d-flex flex-column gap-2 justify-content-center align-items-md-end">
                    {isConfirmed && (
                      <Link
                        to={`/booking-confirmation/${b._id}`}
                        className="btn btn-outline-light btn-sm w-100 w-md-auto d-flex align-items-center justify-content-center gap-2"
                      >
                        <Ticket size={16} /> View E-Ticket & QR
                      </Link>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100 w-md-auto d-flex align-items-center justify-content-center gap-2"
                        disabled={cancellingId === b._id}
                        onClick={() => handleCancelBooking(b._id, b.bookingReference)}
                      >
                        {cancellingId === b._id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span>Cancel Booking</span>
                      </button>
                    )}

                    {isConfirmed && !canCancel && (
                      <span className="text-muted small text-md-end" style={{ fontSize: '0.75rem' }}>
                        Cancellation closed (within 2h of show)
                      </span>
                    )}

                    {isCancelled && (
                      <span className="text-danger small text-md-end">
                        Cancelled • Refund {b.cancellationDetails?.refundStatus || 'Processed'} (₹{b.cancellationDetails?.refundAmount || b.totalAmount})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
