import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { bookingService } from '../../services/bookingService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Search, Ticket, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminService.getBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleAdminCancel = async (bookingId, bookingRef) => {
    const confirm = window.confirm(`Administrative Override: Are you sure you want to cancel booking ${bookingRef}? Seats will be released and refund initiated.`);
    if (!confirm) return;

    try {
      await bookingService.cancelBooking(bookingId, { reason: 'Administrator cancellation override' });
      toast.success(`Booking ${bookingRef} cancelled.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-light mb-1">Bookings & Revenue Audit</h2>
          <p className="text-muted small mb-0">Monitor customer transactions, seat reservations, and cancellation refunds</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 mb-4 row g-2 align-items-center">
        <div className="col-md-6">
          <form onSubmit={handleSearchSubmit} className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm bg-black border-secondary text-light ps-5 py-2"
              placeholder="Search by Booking Reference (e.g. IMV-)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} className="position-absolute text-muted" style={{ top: '10px', left: '16px' }} />
          </form>
        </div>

        <div className="col-md-6 d-flex justify-content-md-end gap-2">
          <select
            className="form-select form-select-sm bg-black border-secondary text-light w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner message="Auditing bookings..." />
      ) : (
        <div className="bg-dark p-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Movie & Show</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="font-monospace small fw-bold text-danger">{b.bookingReference}</td>
                    <td>
                      <div className="fw-semibold small text-light">{b.user?.name || 'Customer'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{b.user?.email}</div>
                    </td>
                    <td>
                      <div className="text-light small fw-semibold">{b.show?.movie?.title || 'Movie'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {b.show?.theatre?.name} • {b.show?.startTime ? new Date(b.show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td>
                      <span className="small text-light">
                        {b.seats?.map((s) => s.seatNumber).join(', ')}
                      </span>
                    </td>
                    <td className="fw-bold text-light">₹{b.grandTotal}</td>
                    <td>
                      <span className={`badge ${b.paymentStatus === 'success' ? 'bg-success' : b.paymentStatus === 'refunded' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : b.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {b.status === 'confirmed' && (
                          <>
                            <Link
                              to={`/booking-confirmation/${b._id}`}
                              className="btn btn-sm btn-outline-light p-1"
                              title="View Ticket"
                            >
                              <Ticket size={16} />
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={() => handleAdminCancel(b._id, b.bookingReference)}
                              title="Cancel & Refund"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
