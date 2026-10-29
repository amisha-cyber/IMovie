/**
 * Escapes special characters for use in a regular expression
 * to prevent ReDoS and unintended regex injection.
 * @param {string} string 
 * @returns {string}
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
