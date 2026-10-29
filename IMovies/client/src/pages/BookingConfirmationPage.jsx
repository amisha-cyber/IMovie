import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.jsx';
import confetti from 'canvas-confetti';
import { CheckCircle2, Printer, Ticket, Calendar, Clock, MapPin, Film, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';

export const BookingConfirmationPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Confetti burst on confirmation
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore confetti error if canvas not supported
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getBookingById(id);
        setBooking(res.data);
      } catch (err) {
        toast.error('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Generating confirmed movie ticket..." />;
  }

  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h2>Booking not found</h2>
        <Link to="/my-bookings" className="btn btn-cinema mt-3">Go to My Bookings</Link>
      </div>
    );
  }

  const show = booking.show || {};
  const movie = show.movie || {};
  const theatre = show.theatre || {};
  const screen = show.screen || {};

  return (
    <div className="container py-5">
      {/* Success Banner */}
      <div className="text-center mb-5 no-print">
        <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mb-3 shadow">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="fw-bold text-light mb-2">Booking Confirmed!</h1>
        <p className="text-muted small">
          Your reservation is confirmed and verified. Please present your digital ticket or QR code at the cinema entrance.
        </p>
      </div>

      {/* Printable Cinema Ticket */}
      <div className="printable-ticket mx-auto" style={{ maxWidth: '720px' }}>
        <div className="bg-dark rounded-4 border border-secondary border-opacity-50 overflow-hidden shadow-lg">
          {/* Ticket Header */}
          <div className="bg-danger p-4 text-white d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Film size={20} />
                <span className="brand-font fs-5 fw-bold">IMOVIES E-TICKET</span>
              </div>
              <div className="small text-white text-opacity-80">
                Authorized Cinema Admission Pass
              </div>
            </div>
            <div className="text-end">
              <div className="small text-white text-opacity-75">BOOKING REF</div>
              <div className="fw-bold fs-5 font-monospace">{booking.bookingReference}</div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-4 p-md-5">
            <div className="row g-4 align-items-center">
              <div className="col-md-8">
                <span className="badge bg-secondary bg-opacity-50 border border-secondary mb-2">
                  {screen.screenType || 'Dolby Cinema'} • {screen.name || 'Audi 1'}
                </span>
                <h3 className="fw-bold text-light mb-2">{movie.title || 'Movie'}</h3>

                <div className="d-flex flex-wrap gap-3 text-muted small mb-4">
                  <span className="d-flex align-items-center gap-1">
                    <Calendar size={15} /> {new Date(show.startTime).toLocaleDateString()}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Clock size={15} /> {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <MapPin size={15} className="text-danger" /> {theatre.name}, {theatre.city}
                  </span>
                </div>

                <div className="bg-black p-3 rounded-3 border border-secondary border-opacity-25 mb-3">
                  <div className="small text-muted mb-1">RESERVED SEATS</div>
                  <div className="d-flex flex-wrap gap-2">
                    {booking.seats?.map((seat) => (
                      <span key={seat.seatNumber} className="badge bg-danger fs-6 py-2 px-3 fw-bold">
                        {seat.seatNumber} ({seat.category})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-between small text-muted border-top border-secondary border-opacity-25 pt-3">
                  <span>Grand Total Paid (incl. Taxes)</span>
                  <span className="fw-bold text-light fs-6">₹{booking.grandTotal}</span>
                </div>
              </div>

              {/* QR Code Validation Box */}
              <div className="col-md-4 text-center">
                <div className="p-3 bg-white rounded-3 shadow-sm d-inline-block">
                  {booking.qrCode ? (
                    <img
                      src={booking.qrCode}
                      alt="Booking Verification QR"
                      style={{ width: '150px', height: '150px' }}
                    />
                  ) : (
                    <div style={{ width: '150px', height: '150px' }} className="d-flex align-items-center justify-content-center text-muted small">
                      QR Code
                    </div>
                  )}
                </div>
                <div className="mt-2 text-muted small" style={{ fontSize: '0.75rem' }}>
                  Scan at Entrance Turnstile
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer Notes */}
          <div className="bg-black p-3 text-muted small border-top border-secondary border-opacity-25 text-center" style={{ fontSize: '0.75rem' }}>
            Terms & Conditions: Outside food is strictly prohibited. Cancellations permitted up to 2 hours prior to scheduled showtime.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mt-4 no-print">
        <button onClick={handlePrint} className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2">
          <Printer size={18} /> Print Ticket / Save PDF
        </button>
        <Link to="/my-bookings" className="btn btn-cinema d-flex align-items-center gap-2 px-4 py-2">
          <Ticket size={18} /> View All Bookings
        </Link>
      </div>
    </div>
  );
};
