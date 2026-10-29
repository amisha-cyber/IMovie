import React from 'react';
import { X } from 'lucide-react';

export const getSafeYouTubeEmbedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    let videoId = null;

    if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0];
      }
    } else if (hostname === 'youtu.be') {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0];
    } else if (hostname === 'www.youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0];
      }
    }

    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    }
    return null;
  } catch {
    return null;
  }
};

export const TrailerModal = ({ isOpen, onClose, trailerUrl, movieTitle }) => {
  if (!isOpen) return null;

  const embedUrl = getSafeYouTubeEmbedUrl(trailerUrl);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-dark border-secondary border-opacity-50 text-light shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-secondary border-opacity-25 py-3">
            <h5 className="modal-title fw-bold text-truncate">{movieTitle} — Official Trailer</h5>
            <button type="button" className="btn btn-sm btn-outline-secondary rounded-circle" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-0">
            <div className="ratio ratio-16x9">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${movieTitle} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted">
                  Trailer not available for this movie.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
