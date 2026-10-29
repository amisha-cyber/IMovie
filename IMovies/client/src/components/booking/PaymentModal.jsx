import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, ShieldCheck, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { bookingService } from '../../services/bookingService.js';
import { toast } from 'react-toastify';

export const PaymentModal = ({ isOpen, onClose, holdData, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldFail, setShouldFail] = useState(false);

  if (!isOpen || !holdData) return null;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on the server
      const orderRes = await bookingService.createPaymentOrder({
        bookingId: holdData.bookingId
      });

      const orderData = orderRes.data;

      // 2. Call simulator endpoint
      const simRes = await bookingService.simulatePayment({
        orderId: orderData.orderId,
        method: paymentMethod,
        shouldFail
      });

      // 3. Confirm booking atomically on the server
      const confirmRes = await bookingService.confirmBooking({
        bookingId: holdData.bookingId,
        orderId: orderData.orderId,
        paymentId: simRes.data.paymentId,
        signature: 'simulated_valid_signature',
        method: paymentMethod
      });

      toast.success('Payment verified! Booking confirmed.');
      onPaymentSuccess(confirmRes.data);
    } catch (err) {
      toast.error(err.message || 'Payment failed or declined.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark border-secondary border-opacity-50 text-light shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-secondary border-opacity-25 py-3">
            <div className="d-flex align-items-center gap-2">
              <ShieldCheck className="text-success" size={20} />
              <h5 className="modal-title fw-bold">Secure Checkout</h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onClose} disabled={isProcessing}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body p-4">
            {/* Development Environment Badge */}
            <div className="alert alert-info bg-info bg-opacity-10 border-info border-opacity-25 py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-info text-dark">SANDBOX</span>
              <span>Development Payment Simulator active. No actual charges will be incurred.</span>
            </div>

            {/* Order Summary */}
            <div className="bg-black p-3 rounded-3 border border-secondary border-opacity-25 mb-4">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Booking Reference</span>
                <span className="text-light font-monospace">{holdData.bookingReference}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Selected Seats</span>
                <span className="text-light fw-bold">{holdData.seats?.map((s) => s.seatNumber).join(', ')}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Tickets Subtotal</span>
                <span>₹{holdData.totalAmount}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-2">
                <span>Convenience Fee (incl. GST)</span>
                <span>₹{holdData.convenienceFee}</span>
              </div>
              <div className="border-top border-secondary border-opacity-25 pt-2 d-flex justify-content-between fw-bold text-light fs-5">
                <span>Grand Total</span>
                <span className="text-danger">₹{holdData.grandTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <h6 className="fw-bold mb-3 small text-uppercase text-muted tracking-wide">Select Payment Method</h6>
            <div className="d-flex flex-column gap-2 mb-4">
              <label
                className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${
                  paymentMethod === 'card' ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-black'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="d-flex align-items-center gap-3">
                  <CreditCard className="text-danger" size={20} />
                  <div>
                    <div className="fw-semibold small">Credit / Debit Card</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Visa, Mastercard, RuPay</div>
                  </div>
                </div>
                {paymentMethod === 'card' && <CheckCircle2 size={18} className="text-danger" />}
              </label>

              <label
                className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${
                  paymentMethod === 'upi' ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-black'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="d-flex align-items-center gap-3">
                  <Smartphone className="text-success" size={20} />
                  <div>
                    <div className="fw-semibold small">UPI / QR Payment</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Google Pay, PhonePe, Paytm</div>
                  </div>
                </div>
                {paymentMethod === 'upi' && <CheckCircle2 size={18} className="text-danger" />}
              </label>

              <label
                className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${
                  paymentMethod === 'netbanking' ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-black'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <div className="d-flex align-items-center gap-3">
                  <Building className="text-warning" size={20} />
                  <div>
                    <div className="fw-semibold small">Net Banking</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>HDFC, ICICI, SBI, Axis</div>
                  </div>
                </div>
                {paymentMethod === 'netbanking' && <CheckCircle2 size={18} className="text-danger" />}
              </label>
            </div>

            {/* Test Simulation Controls */}
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="failSwitch"
                checked={shouldFail}
                onChange={(e) => setShouldFail(e.target.checked)}
              />
              <label className="form-check-label small text-muted" htmlFor="failSwitch">
                Simulate payment gateway decline (for error handling test)
              </label>
            </div>
          </div>

          <div className="modal-footer border-secondary border-opacity-25 p-3">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-cinema d-flex align-items-center gap-2"
              onClick={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <span>Pay ₹{holdData.grandTotal} & Confirm</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
