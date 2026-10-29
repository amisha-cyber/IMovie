import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export const HoldCountdown = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpired) onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 90; // Less than 1.5 minutes

  if (!expiresAt) return null;

  return (
    <div className={`p-3 rounded-4 border ${isUrgent ? 'bg-danger bg-opacity-10 border-danger' : 'bg-warning bg-opacity-10 border-warning'} mb-4 d-flex align-items-center justify-content-between`}>
      <div className="d-flex align-items-center gap-2">
        {isUrgent ? <AlertCircle size={20} className="text-danger" /> : <Clock size={20} className="text-warning" />}
        <span className="small">
          Seats held exclusively for you. Complete booking before timer expires:
        </span>
      </div>
      <div className={`fw-bold fs-5 font-monospace ${isUrgent ? 'text-danger' : 'text-warning'}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
};
