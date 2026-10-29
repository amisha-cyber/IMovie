/**
 * Sanitizes a redirect path to ensure it is a safe relative internal route.
 * Rejects absolute URLs, protocol-relative URLs (//), backslashes, control characters,
 * and dangerous schemes (javascript:, data:, vbscript:).
 * 
 * @param {string|null|undefined} targetPath - The raw redirect target from URL params or state
 * @param {string} fallbackPath - Default fallback if input is invalid (defaults to '/')
 * @returns {string} Safe internal pathname
 */
export const sanitizeRedirectPath = (targetPath, fallbackPath = '/') => {
  if (!targetPath || typeof targetPath !== 'string') {
    return fallbackPath;
  }

  const trimmed = targetPath.trim();

  // Reject protocol-relative URLs (e.g. "//evil.com") and Windows UNC / backslash escapes
  if (trimmed.startsWith('//') || trimmed.startsWith('\\') || trimmed.includes('\\')) {
    return fallbackPath;
  }

  // Reject absolute URLs with schemes (e.g. "https:", "http:", "javascript:", "data:", "vbscript:")
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
    return fallbackPath;
  }

  // Must begin with a single '/'
  if (!trimmed.startsWith('/')) {
    return fallbackPath;
  }

  // Reject CR, LF, null byte, or ASCII control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallbackPath;
  }

  return trimmed;
};
