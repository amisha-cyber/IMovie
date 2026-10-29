import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeatLegend } from '../components/booking/SeatLegend.jsx';

describe('SeatLegend Component', () => {
  it('renders all seat states and tier prices', () => {
    const pricing = { silver: 200, gold: 260, platinum: 360 };
    render(<SeatLegend pricing={pricing} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Reserved (Hold)')).toBeInTheDocument();
    expect(screen.getByText('Sold Out')).toBeInTheDocument();

    expect(screen.getByText('₹200')).toBeInTheDocument();
    expect(screen.getByText('₹260')).toBeInTheDocument();
    expect(screen.getByText('₹360')).toBeInTheDocument();
  });
});
