import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VerifyEmailPage } from '../pages/VerifyEmailPage.jsx';

// Mock authService
vi.mock('../services/authService.js', () => ({
  authService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn()
  }
}));

describe('VerifyEmailPage Component', () => {
  it('renders IMovies branding, email input, and 6 OTP digit inputs', () => {
    render(
      <BrowserRouter>
        <VerifyEmailPage />
      </BrowserRouter>
    );

    // Branding
    expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    expect(
      screen.getByText(/To activate your IMovies account and secure cinema bookings/i)
    ).toBeInTheDocument();

    // Email input
    const emailInput = screen.getByPlaceholderText('name@example.com');
    expect(emailInput).toBeInTheDocument();

    // 6 OTP boxes
    for (let i = 0; i < 6; i++) {
      expect(document.getElementById(`otp-input-${i}`)).toBeInTheDocument();
    }

    // Buttons
    expect(screen.getByRole('button', { name: /Verify Email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend Verification Code/i })).toBeInTheDocument();
  });

  it('disables Verify button until all 6 OTP digits and email are present', () => {
    render(
      <BrowserRouter>
        <VerifyEmailPage />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('name@example.com');
    const verifyBtn = screen.getByRole('button', { name: /Verify Email/i });

    // Initially disabled
    expect(verifyBtn).toBeDisabled();

    // Enter email
    fireEvent.change(emailInput, { target: { value: 'user@cinema.com' } });
    expect(verifyBtn).toBeDisabled();

    // Enter only 3 digits
    fireEvent.change(document.getElementById('otp-input-0'), { target: { value: '1' } });
    fireEvent.change(document.getElementById('otp-input-1'), { target: { value: '2' } });
    fireEvent.change(document.getElementById('otp-input-2'), { target: { value: '3' } });
    expect(verifyBtn).toBeDisabled();

    // Fill remaining 3 digits
    fireEvent.change(document.getElementById('otp-input-3'), { target: { value: '4' } });
    fireEvent.change(document.getElementById('otp-input-4'), { target: { value: '5' } });
    fireEvent.change(document.getElementById('otp-input-5'), { target: { value: '6' } });

    // Now button should be enabled
    expect(verifyBtn).not.toBeDisabled();
  });
});
