import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TrailerModal, getSafeYouTubeEmbedUrl } from '../components/movies/TrailerModal.jsx';

describe('TrailerModal & YouTube-only URL Validation', () => {
  it('extracts valid embed URL from standard youtube.com watch links', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const embed = getSafeYouTubeEmbedUrl(url);
    expect(embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });

  it('extracts valid embed URL from short youtu.be links', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ?si=abcdef123';
    const embed = getSafeYouTubeEmbedUrl(url);
    expect(embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });

  it('extracts valid embed URL from youtube embed links', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    const embed = getSafeYouTubeEmbedUrl(url);
    expect(embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });

  it('rejects non-YouTube video URLs (Vimeo, DailyMotion, arbitrary domains)', () => {
    expect(getSafeYouTubeEmbedUrl('https://vimeo.com/123456789')).toBeNull();
    expect(getSafeYouTubeEmbedUrl('https://evil.com/video.mp4')).toBeNull();
    expect(getSafeYouTubeEmbedUrl('https://attacker.site/embed/dQw4w9WgXcQ')).toBeNull();
  });

  it('rejects malicious pseudo-protocols like javascript: or data:', () => {
    expect(getSafeYouTubeEmbedUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeYouTubeEmbedUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('renders iframe with safe youtube embed when given a valid trailer URL', () => {
    render(
      <TrailerModal
        isOpen={true}
        onClose={() => {}}
        trailerUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        movieTitle="Rick Roll"
      />
    );

    const iframe = screen.getByTitle('Rick Roll Trailer');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
  });

  it('does NOT render an iframe when given a non-YouTube or malicious trailer URL', () => {
    render(
      <TrailerModal
        isOpen={true}
        onClose={() => {}}
        trailerUrl="https://evil.com/exploit"
        movieTitle="Exploit Movie"
      />
    );

    expect(screen.queryByTitle('Exploit Movie Trailer')).not.toBeInTheDocument();
    expect(screen.getByText(/Trailer not available for this movie/i)).toBeInTheDocument();
  });
});
