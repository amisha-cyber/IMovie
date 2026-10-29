import React from 'react';

export const SeatGrid = ({ seats, selectedSeats, onToggleSeat }) => {
  // Group seats by row
  const rowsMap = {};
  for (const s of seats) {
    if (!rowsMap[s.row]) rowsMap[s.row] = [];
    rowsMap[s.row].push(s);
  }

  // Sort rows alphabetically (A, B, C...)
  const rowLetters = Object.keys(rowsMap).sort();

  return (
    <div className="seat-grid-wrapper overflow-auto py-3 px-2">
      {/* Cinema Screen Curve */}
      <div className="cinema-screen-container">
        <div className="cinema-screen"></div>
        <div className="cinema-screen-text">All eyes this way — Cinema Screen</div>
      </div>

      {/* Seating Layout Grid */}
      <div className="d-flex flex-column align-items-center gap-2 mt-4" style={{ minWidth: '450px' }}>
        {rowLetters.map((rowLetter) => {
          const rowSeats = rowsMap[rowLetter].sort((a, b) => a.number - b.number);
          const category = rowSeats[0]?.category || 'SILVER';

          return (
            <div key={rowLetter} className="d-flex align-items-center justify-content-center gap-1 w-100">
              {/* Row Label Left */}
              <span className="text-muted fw-bold small me-2" style={{ width: '20px', textAlign: 'center' }}>
                {rowLetter}
              </span>

              {/* Row Seats */}
              <div className="d-flex align-items-center">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  const isBooked = seat.status === 'BOOKED' || seat.status === 'BLOCKED';
                  const isHeld = seat.status === 'HELD' && !seat.isHeldByMe;

                  let seatClass = 'seat-available';
                  if (isSelected) {
                    seatClass = 'seat-selected';
                  } else if (isBooked) {
                    seatClass = 'seat-booked';
                  } else if (isHeld) {
                    seatClass = 'seat-held';
                  }

                  const isDisabled = isBooked || isHeld;

                  return (
                    <React.Fragment key={seat.seatNumber}>
                      <button
                        type="button"
                        className={`seat-button ${seatClass}`}
                        disabled={isDisabled}
                        onClick={() => onToggleSeat(seat.seatNumber)}
                        title={`${seat.seatNumber} (${category}) - ₹${seat.price} [${seat.status}]`}
                      >
                        {seat.number}
                      </button>
                      {/* Aisle gap if applicable */}
                      {(seat.number === 3 || seat.number === rowSeats.length - 3) && (
                        <div style={{ width: '16px' }} aria-hidden="true" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="text-muted fw-bold small ms-2" style={{ width: '20px', textAlign: 'center' }}>
                {rowLetter}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
