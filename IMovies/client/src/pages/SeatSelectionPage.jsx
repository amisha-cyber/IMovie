import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { showService } from '../services/showService.js';
import { bookingService } from '../services/bookingService.js';
import { getSocket } from '../services/socket.js';
import { SeatGrid } from '../components/booking/SeatGrid.jsx';
import { SeatLegend } from '../components/booking/SeatLegend.jsx';
import { HoldCountdown } from '../components/booking/HoldCountdown.jsx';
import { PaymentModal } from '../components/booking/PaymentModal.jsx';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import {
  toggleSeatSelection,
  clearSeatSelection,
  setHoldData,
  clearHoldData
} from '../store/bookingSlice.js';
import { toast } from 'react-toastify';
import { Clock, MapPin, Calendar, Film, ShieldCheck } from 'lucide-react';

export const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedSeats, holdData, holdExpiresAt } = useSelector((state) => state.booking);

  const [showDetails, setShowDetails] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingHold, setIsSubmittingHold] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Fetch initial authoritative seats & show details
  const fetchSeatInventory = async () => {
    try {
      setLoading(true);
      const res = await showService.getSeats(showId);
      setShowDetails(res.data.show);
      setSeats(res.data.seats || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load seats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(clearSeatSelection());
    dispatch(clearHoldData());
    fetchSeatInventory();

    // Setup Socket.IO real-time room & listeners
    const socket = getSocket();
    socket.emit('join-show', { showId });

    socket.on('seat-availability-updated', ({ seats: updatedSeats }) => {
      if (Array.isArray(updatedSeats)) {
        setSeats(updatedSeats);
      }
    });

    socket.on('seat-hold-created', ({ seatNumbers, expiresAt }) => {
      setSeats((prevSeats) =>
        prevSeats.map((s) =>
          seatNumbers.includes(s.seatNumber) && s.status !== 'BOOKED'
            ? { ...s, status: 'HELD', heldUntil: expiresAt }
            : s
        )
      );
    });

    socket.on('seat-hold-released', ({ seatNumbers }) => {
      setSeats((prevSeats) =>
        prevSeats.map((s) =>
          seatNumbers.includes(s.seatNumber) && s.status !== 'BOOKED'
            ? { ...s, status: 'AVAILABLE', heldUntil: null }
            : s
        )
      );
    });

    socket.on('booking-confirmed', ({ seatNumbers }) => {
      setSeats((prevSeats) =>
        prevSeats.map((s) =>
          seatNumbers.includes(s.seatNumber)
            ? { ...s, status: 'BOOKED', heldUntil: null }
            : s
        )
      );
    });

    return () => {
      socket.emit('leave-show', { showId });
      socket.off('seat-availability-updated');
      socket.off('seat-hold-created');
      socket.off('seat-hold-released');
      socket.off('booking-confirmed');
    };
  }, [showId, dispatch]);

  const handleToggleSeat = (seatNumber) => {
    // If hold is currently active, prompt user
    if (holdData) {
      toast.info('You already have an active reservation hold. Please complete payment or let it expire.');
      return;
    }
    dispatch(toggleSeatSelection(seatNumber));
  };

  // Calculate live estimate subtotal for selected seats
  const selectedSeatObjects = seats.filter((s) => selectedSeats.includes(s.seatNumber));
  const estimatedSubtotal = selectedSeatObjects.reduce((sum, s) => sum + s.price, 0);
  const estimatedFee = selectedSeats.length * 25;
  const estimatedTotal = estimatedSubtotal + estimatedFee;

  const handleReserveSeats = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in or register to reserve seats.');
      navigate(`/login?redirect=/book/${showId}`);
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed.');
      return;
    }

    setIsSubmittingHold(true);
    try {
      const res = await bookingService.holdSeats({
        showId,
        seats: selectedSeats
      });

      dispatch(setHoldData(res.data));
      setIsPaymentOpen(true);
      toast.success('Seats reserved temporarily! Please complete payment.');
    } catch (err) {
      toast.error(err.message || 'Seat reservation conflict. Seats were taken.');
      // Refresh authoritative seats immediately on conflict
      fetchSeatInventory();
      dispatch(clearSeatSelection());
    } finally {
      setIsSubmittingHold(false);
    }
  };

  const handleHoldExpired = () => {
    toast.warn('Your temporary reservation hold has expired. Please select seats again.');
    dispatch(clearHoldData());
    setIsPaymentOpen(false);
    fetchSeatInventory();
  };

  const handlePaymentSuccess = (confirmedBooking) => {
    setIsPaymentOpen(false);
    dispatch(clearHoldData());
    navigate(`/booking-confirmation/${confirmedBooking._id}`);
  };

  if (loading && !showDetails) {
    return <LoadingSpinner message="Generating real-time cinema seating..." />;
  }

  return (
    <div style={{ background: 'var(--imv-canvas)', minHeight: '100vh' }} className="py-4">
      <div className="container-xl">
        {/* Show Header */}
        {showDetails && (
          <div
            className="p-4 rounded-4 mb-4 shadow-sm"
            style={{
              background: 'var(--imv-surface-1)',
              border: '1px solid var(--imv-border)'
            }}
          >
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge px-2 py-0.5 label-caps" style={{ background: 'var(--imv-primary)', color: '#fff' }}>
                    {showDetails.screenType || 'Dolby Atmos'}
                  </span>
                  <span className="small text-muted">• {showDetails.screenName}</span>
                </div>
                <h2 className="font-display fw-bold mb-1 text-white">{showDetails.movieTitle}</h2>
                <div className="d-flex flex-wrap align-items-center gap-3 small" style={{ color: 'var(--imv-text-muted)' }}>
                  <span className="d-flex align-items-center gap-1">
                    <MapPin size={14} style={{ color: 'var(--imv-primary)' }} /> {showDetails.theatreName}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Calendar size={14} /> {new Date(showDetails.startTime).toLocaleDateString()}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Clock size={14} /> {new Date(showDetails.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div
                className="d-flex align-items-center gap-2 small py-2 px-3 rounded-pill"
                style={{
                  background: 'var(--imv-surface-container)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981'
                }}
              >
                <span className="spinner-grow spinner-grow-sm text-success" role="status" />
                <span>Live Seat Sync Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Hold Countdown if hold exists */}
        {holdData && (
          <HoldCountdown
            expiresAt={holdExpiresAt}
            onExpired={handleHoldExpired}
          />
        )}

        {/* Seating Legend */}
        <SeatLegend pricing={showDetails?.seatPricing} />

        {/* Interactive Seat Grid */}
        <div
          className="p-3 p-md-4 rounded-4 mb-4 shadow-lg text-center"
          style={{
            background: 'var(--imv-surface-1)',
            border: '1px solid var(--imv-border)'
          }}
        >
          <SeatGrid
            seats={seats}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        {/* Bottom Sticky Action Bar */}
        <div
          className="p-4 rounded-4 shadow-lg sticky-bottom mb-4"
          style={{
            background: 'var(--imv-surface-2)',
            border: '1px solid var(--imv-border)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="row align-items-center g-3">
            <div className="col-md-7">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <span className="label-caps" style={{ color: 'var(--imv-text-muted)' }}>
                  Selected Seats ({selectedSeats.length}):
                </span>
              {selectedSeats.length === 0 ? (
                <span className="text-secondary small fst-italic">None selected (tap up to 10 seats above)</span>
              ) : (
                selectedSeats.map((seatNum) => (
                  <span key={seatNum} className="badge bg-danger py-2 px-3 fw-bold">
                    {seatNum}
                  </span>
                ))
              )}
            </div>
            {selectedSeats.length > 0 && (
              <div className="text-muted small">
                Tickets: ₹{estimatedSubtotal} + Fee: ₹{estimatedFee}
              </div>
            )}
          </div>

          <div className="col-md-5 d-flex justify-content-md-end align-items-center gap-3">
            {selectedSeats.length > 0 && (
              <div className="text-end">
                <div className="small text-muted">Estimated Total</div>
                <div className="fs-4 fw-bold text-danger">₹{estimatedTotal}</div>
              </div>
            )}

            {holdData ? (
              <button
                type="button"
                className="btn btn-cinema d-flex align-items-center gap-2 py-3 px-4"
                onClick={() => setIsPaymentOpen(true)}
              >
                <ShieldCheck size={18} /> Complete Payment
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-cinema d-flex align-items-center gap-2 py-3 px-4"
                disabled={selectedSeats.length === 0 || isSubmittingHold}
                onClick={handleReserveSeats}
              >
                {isSubmittingHold ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Claiming Seats...</span>
                  </>
                ) : (
                  <span>Hold & Checkout &rarr;</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        holdData={holdData}
        onPaymentSuccess={handlePaymentSuccess}
      />
      </div>
    </div>
  );
};
