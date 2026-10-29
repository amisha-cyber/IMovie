import { describe, it, expect } from 'vitest';
import { sanitizeRedirectPath } from '../utils/sanitizeRedirect.js';

describe('sanitizeRedirectPath Open Redirect Protection', () => {
  it('allows safe internal relative paths', () => {
    expect(sanitizeRedirectPath('/movies')).toBe('/movies');
    expect(sanitizeRedirectPath('/booking/show-123')).toBe('/booking/show-123');
    expect(sanitizeRedirectPath('/admin/theatres?city=Mumbai')).toBe('/admin/theatres?city=Mumbai');
    expect(sanitizeRedirectPath('/')).toBe('/');
  });

  it('rejects protocol-relative URLs (//)', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/');
    expect(sanitizeRedirectPath('//google.com/phish')).toBe('/');
    expect(sanitizeRedirectPath('///evil.com')).toBe('/');
  });

  it('rejects Windows UNC and backslash escapes', () => {
    expect(sanitizeRedirectPath('\\\\evil.com')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.com')).toBe('/');
    expect(sanitizeRedirectPath('\\evil.com')).toBe('/');
  });

  it('rejects absolute URLs with http/https schemes', () => {
    expect(sanitizeRedirectPath('http://evil.com')).toBe('/');
    expect(sanitizeRedirectPath('https://attacker.com/steal-creds')).toBe('/');
    expect(sanitizeRedirectPath('HTTP://EVIL.COM')).toBe('/');
  });

  it('rejects dangerous URI schemes (javascript, data, vbscript)', () => {
    expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/');
    expect(sanitizeRedirectPath('vbscript:msgbox(1)')).toBe('/');
  });

  it('rejects paths without leading slash', () => {
    expect(sanitizeRedirectPath('movies')).toBe('/');
    expect(sanitizeRedirectPath('about')).toBe('/');
  });

  it('rejects null, undefined, and non-string inputs', () => {
    expect(sanitizeRedirectPath(null)).toBe('/');
    expect(sanitizeRedirectPath(undefined)).toBe('/');
    expect(sanitizeRedirectPath(123)).toBe('/');
    expect(sanitizeRedirectPath({})).toBe('/');
  });

  it('supports custom fallback path', () => {
    expect(sanitizeRedirectPath('//evil.com', '/fallback')).toBe('/fallback');
    expect(sanitizeRedirectPath(null, '/home')).toBe('/home');
  });

  it('rejects control characters (CRLF injection)', () => {
    expect(sanitizeRedirectPath('/movies\r\nSet-Cookie:malicious')).toBe('/');
  });
});
