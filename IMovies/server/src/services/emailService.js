import nodemailer from 'nodemailer';
import { env, isProduction } from '../config/environment.js';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isMock = false;
    this.initTransporter();
  }

  initTransporter() {
    if (isProduction()) {
      if (env.SMTP_USER && env.SMTP_PASS) {
        try {
          this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          });
          this.isMock = false;
          logger.info(`EmailService: Real SMTP configured with host ${env.SMTP_HOST}:${env.SMTP_PORT}`);
        } catch (err) {
          logger.error('EmailService: Failed to configure production SMTP transporter:', err.message);
          this.transporter = null;
          this.isMock = false;
        }
      } else {
        logger.warn('EmailService: Production environment has no SMTP credentials configured. Outbound email delivery disabled.');
        this.transporter = null;
        this.isMock = false;
      }
      return;
    }

    // Development & Test environments
    if (env.SMTP_USER && env.SMTP_PASS && env.NODE_ENV !== 'test') {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
          }
        });
        this.isMock = false;
        logger.info(`EmailService: Real SMTP configured with host ${env.SMTP_HOST}:${env.SMTP_PORT} (${env.SMTP_USER})`);
      } catch (err) {
        logger.error('EmailService: Failed to configure SMTP transporter:', err.message);
        this.fallbackToMock();
      }
    } else {
      this.fallbackToMock();
    }
  }

  fallbackToMock() {
    if (isProduction()) {
      this.transporter = null;
      this.isMock = false;
      logger.error('EmailService: Mock transport is strictly prohibited in production.');
      return;
    }
    this.isMock = true;
    this.transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    if (env.NODE_ENV === 'development') {
      logger.info('EmailService: Running in development mock mode (Verification codes and links logged for dev).');
    }
  }

  /**
   * Sends a branded HTML verification email with both a direct verification link and a 6-digit OTP
   */
  async sendVerificationEmail({ to, name, token, otp }) {
    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
    const ttlMinutes = env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 60;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your IMovies Account</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b0f17; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #121824; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .header { background: #e50914; padding: 28px 20px; text-align: center; }
    .logo { font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: 1px; }
    .body { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
    .text { color: #94a3b8; font-size: 15px; margin-bottom: 24px; }
    .button-container { text-align: center; margin: 32px 0; }
    .btn { background-color: #e50914; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(229,9,20,0.4); }
    .otp-box { background: #080b11; border: 1px solid rgba(229,9,20,0.4); border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 6px; }
    .otp-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #e50914; letter-spacing: 6px; }
    .footer { padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; text-align: center; }
    .fallback { word-break: break-all; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IMOVIES CINEMA</div>
    </div>
    <div class="body">
      <div class="greeting">Welcome to IMovies, ${name}!</div>
      <p class="text">
        Thank you for creating an account. To unlock real-time cinema seat reservations, movie booking history, and exclusive tickets, please verify your email address.
      </p>

      <div class="button-container">
        <a href="${verificationUrl}" target="_blank" class="btn">Verify Email Address</a>
      </div>

      <div class="otp-box">
        <div class="otp-label">Or Enter This 6-Digit Verification Code:</div>
        <div class="otp-code">${otp}</div>
      </div>

      <p class="text" style="font-size: 13px;">
        ⏳ This verification link and OTP code will expire in <strong>${ttlMinutes} minutes</strong>.
      </p>

      <p class="text" style="font-size: 12px; margin-top: 24px;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <span class="fallback">${verificationUrl}</span>
      </p>
    </div>
    <div class="footer">
      If you did not sign up for an IMovies account, please disregard this email. Your email will remain inactive.<br>
      &copy; ${new Date().getFullYear()} IMovies Cinema Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    const plainText = `
Welcome to IMovies, ${name}!

Thank you for registering. Please verify your email address using the link below:
${verificationUrl}

Or enter your 6-digit verification code: ${otp}

This verification link and OTP will expire in ${ttlMinutes} minutes.

If you did not sign up for an IMovies account, please disregard this message.
`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Verify Your IMovies Account',
      html: htmlContent,
      text: plainText
    };

    if (isProduction() && (!this.transporter || this.isMock)) {
      logger.error('EmailService: Outbound email delivery unavailable in production.');
      const deliveryError = new Error('Failed to deliver verification email. Please try again later.');
      deliveryError.statusCode = 502;
      throw deliveryError;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (this.isMock) {
        if (env.NODE_ENV === 'development') {
          logger.info(`=======================================================`);
          logger.info(`📧 [DEV EMAIL MOCK] Verification Email for ${to}`);
          logger.info(`🔑 6-Digit OTP: ${otp}`);
          logger.info(`🔗 Direct Verification Link: ${verificationUrl}`);
          logger.info(`=======================================================`);
        }
      } else {
        if (isProduction()) {
          logger.info('Verification email sent successfully.');
        } else {
          logger.info(`Verification email sent to ${to} (MessageId: ${info.messageId})`);
        }
      }

      return {
        success: true,
        messageId: info.messageId || 'mock-id',
        isMock: this.isMock,
        previewUrl: nodemailer.getTestMessageUrl(info) || null
      };
    } catch (err) {
      if (isProduction()) {
        logger.error('Failed to deliver verification email in production.');
      } else {
        logger.error(`Failed to send verification email to ${to}:`, err.message);
      }
      const deliveryError = new Error('Failed to deliver verification email. Please verify your email address or try again later.');
      deliveryError.statusCode = 502;
      throw deliveryError;
    }
  }

  /**
   * Sends a branded HTML password reset email with a secure single-use link
   */
  async sendPasswordResetEmail({ to, name, resetToken }) {
    const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your IMovies Password</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b0f17; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #121824; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .header { background: #e50914; padding: 28px 20px; text-align: center; }
    .logo { font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: 1px; }
    .body { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
    .text { color: #94a3b8; font-size: 15px; margin-bottom: 24px; }
    .button-container { text-align: center; margin: 32px 0; }
    .btn { background-color: #e50914; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 14px rgba(229,9,20,0.4); }
    .footer { padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; text-align: center; }
    .fallback { word-break: break-all; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IMOVIES CINEMA</div>
    </div>
    <div class="body">
      <div class="greeting">Hello, ${name || 'Customer'}!</div>
      <p class="text">
        We received a request to reset the password for your IMovies account. Click the button below to choose a new, secure password.
      </p>

      <div class="button-container">
        <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
      </div>

      <p class="text" style="font-size: 13px;">
        ⏳ This password reset link will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure.
      </p>

      <p class="text" style="font-size: 12px; margin-top: 24px;">
        If the button above does not work, copy and paste this link into your browser:<br>
        <span class="fallback">${resetUrl}</span>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} IMovies Cinema Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    const plainText = `
Hello, ${name || 'Customer'}!

We received a request to reset your IMovies password. Use the link below to set a new password:
${resetUrl}

This link will expire in 15 minutes. If you did not request this, please ignore this message.
`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Reset Your IMovies Password',
      html: htmlContent,
      text: plainText
    };

    if (isProduction() && (!this.transporter || this.isMock)) {
      logger.error('EmailService: Outbound email delivery unavailable in production.');
      const deliveryError = new Error('Failed to deliver password reset email. Please try again later.');
      deliveryError.statusCode = 502;
      throw deliveryError;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (this.isMock) {
        if (env.NODE_ENV === 'development') {
          logger.info(`=======================================================`);
          logger.info(`📧 [DEV EMAIL MOCK] Password Reset Email for ${to}`);
          logger.info(`🔗 Reset Link: ${resetUrl}`);
          logger.info(`=======================================================`);
        }
      } else {
        if (isProduction()) {
          logger.info('Password reset email sent successfully.');
        } else {
          logger.info(`Password reset email sent to ${to} (MessageId: ${info.messageId})`);
        }
      }

      return {
        success: true,
        messageId: info.messageId || 'mock-id',
        isMock: this.isMock,
        previewUrl: nodemailer.getTestMessageUrl(info) || null
      };
    } catch (err) {
      if (isProduction()) {
        logger.error('Failed to deliver password reset email in production.');
      } else {
        logger.error(`Failed to send password reset email to ${to}:`, err.message);
      }
      const deliveryError = new Error('Failed to deliver password reset email. Please try again later.');
      deliveryError.statusCode = 502;
      throw deliveryError;
    }
  }

  /**
   * Sends a branded HTML booking confirmation email with ticket details and inline QR code
   */
  async sendBookingConfirmationEmail({ to, name, booking }) {
    if (isProduction() && (!this.transporter || this.isMock)) {
      logger.error('EmailService: Outbound email delivery unavailable in production.');
      return {
        success: false,
        error: 'Failed to deliver booking confirmation email. Please try again later.'
      };
    }

    const show = booking.show || {};
    const movie = show.movie || {};
    const theatre = show.theatre || {};
    const screen = show.screen || {};

    const showDate = show.startTime
      ? new Date(show.startTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'Scheduled Date';

    const showTime = show.startTime
      ? new Date(show.startTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Showtime';

    const seatNumbers = (booking.seats || []).map((s) => s.seatNumber).join(', ');
    const seatBadges = (booking.seats || [])
      .map(
        (s) =>
          `<span style="display:inline-block;background:#e50914;color:#fff;padding:4px 10px;border-radius:4px;font-weight:bold;font-size:13px;margin:2px 4px 2px 0;">${s.seatNumber} (${s.category})</span>`
      )
      .join(' ');

    const attachments = [];
    let qrImgTag = '';
    if (booking.qrCode && booking.qrCode.startsWith('data:image/png;base64,')) {
      const base64Data = booking.qrCode.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: 'ticket-qr.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'ticket-qrcode'
      });
      qrImgTag = `<img src="cid:ticket-qrcode" alt="Ticket QR Code" width="140" height="140" style="display:block;margin:0 auto;border-radius:8px;" />`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IMovies Ticket Confirmation - ${booking.bookingReference}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b0f17; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #121824; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .header { background: #e50914; padding: 24px 20px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 1px; }
    .tagline { font-size: 12px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .body { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #ffffff; }
    .ref-box { background: #080b11; border: 1px dashed rgba(229,9,20,0.5); border-radius: 8px; padding: 14px 20px; margin: 20px 0; text-align: center; }
    .ref-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
    .ref-value { font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold; color: #e50914; letter-spacing: 2px; }
    .ticket-card { background: #1a2234; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.06); }
    .movie-title { font-size: 20px; font-weight: bold; color: #ffffff; margin-bottom: 12px; }
    .seats-box { margin: 16px 0; }
    .footer { padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IMOVIES CINEMA</div>
      <div class="tagline">Official Digital Admission Ticket</div>
    </div>
    <div class="body">
      <div class="greeting">Hi ${name || 'Movie Lover'}! 🎬</div>
      <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">
        Your movie reservation has been successfully confirmed. Present this e-ticket or the QR code at the cinema entry gate.
      </p>

      <div class="ref-box">
        <div class="ref-label">Booking Reference</div>
        <div class="ref-value">${booking.bookingReference}</div>
      </div>

      <div class="ticket-card">
        <div class="movie-title">${movie.title || 'Movie'}</div>
        <table style="width: 100%; font-size: 14px; color: #94a3b8; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Cinema / Theatre:</td>
            <td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${theatre.name || 'Cinema'}${theatre.city ? `, ${theatre.city}` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Auditorium / Screen:</td>
            <td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${screen.name || 'Audi'} (${screen.screenType || '2D/3D'})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${showDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Showtime:</td>
            <td style="padding: 6px 0; text-align: right; color: #ffffff; font-weight: 600;">${showTime}</td>
          </tr>
        </table>

        <div class="seats-box" style="margin-top: 14px;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Reserved Seats:</div>
          <div>${seatBadges}</div>
        </div>

        <table style="width: 100%; font-size: 15px; font-weight: bold; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 14px; padding-top: 12px;">
          <tr>
            <td style="padding-top: 10px;">Total Paid:</td>
            <td style="padding-top: 10px; text-align: right; color: #22c55e;">₹${booking.grandTotal}</td>
          </tr>
        </table>
      </div>

      ${qrImgTag ? `
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 8px;">
          ${qrImgTag}
          <div style="font-size: 11px; color: #333333; margin-top: 6px; font-family: monospace;">Scan at Entry</div>
        </div>
      </div>` : ''}

      <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
        Please arrive 15 minutes prior to the showtime. Enjoy the show!
      </p>
    </div>
    <div class="footer">
      IMovies Entertainment Systems &bull; You received this email because you made a reservation on IMovies.<br>
      &copy; ${new Date().getFullYear()} IMovies Cinema Systems.
    </div>
  </div>
</body>
</html>
`;

    const plainText = `
IMovies Ticket Confirmation
Booking Reference: ${booking.bookingReference}

Hi ${name || 'Movie Lover'}!
Your movie tickets have been confirmed.

Movie: ${movie.title || 'Movie'}
Theatre: ${theatre.name || 'Cinema'}, ${theatre.city || ''}
Screen: ${screen.name || 'Audi'}
Date: ${showDate}
Time: ${showTime}
Seats: ${seatNumbers}
Total Paid: ₹${booking.grandTotal}

Please show this reference code or your QR code at the cinema gate.
Enjoy your movie!
`;

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: `Booking Confirmed! [${booking.bookingReference}] - ${movie.title || 'IMovies Cinema'}`,
      html: htmlContent,
      text: plainText,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (this.isMock) {
        if (env.NODE_ENV === 'development') {
          logger.info(`=======================================================`);
          logger.info(`📧 [DEV EMAIL MOCK] Ticket Confirmation Email for ${to}`);
          logger.info(`🎟️ Ref: ${booking.bookingReference} | Movie: ${movie.title || 'Movie'} | Total: ₹${booking.grandTotal}`);
          logger.info(`💺 Seats: ${seatNumbers}`);
          logger.info(`=======================================================`);
        }
      } else {
        if (isProduction()) {
          logger.info('Booking confirmation email sent successfully.');
        } else {
          logger.info(`Booking confirmation email sent to ${to} (MessageId: ${info.messageId})`);
        }
      }

      return {
        success: true,
        messageId: info.messageId || 'mock-id',
        isMock: this.isMock
      };
    } catch (err) {
      if (isProduction()) {
        logger.error('Failed to deliver booking confirmation email in production.');
      } else {
        logger.error(`Failed to send booking confirmation email to ${to}:`, err.message);
      }
      return {
        success: false,
        error: isProduction()
          ? 'Failed to deliver booking confirmation email. Please try again later.'
          : err.message
      };
    }
  }
}

export const emailService = new EmailService();
