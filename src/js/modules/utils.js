/**
 * General utility functions shared across modules
 */

/**
 * Checks if passive event listeners are supported
 * @returns {boolean|object} Returns passive listener option or false if not supported
 */
export const passiveSupported = () => {
  let passive = false;
  try {
    const options = {
      get passive() {
        passive = true;
        return true;
      }
    };
    window.addEventListener("test", null, options);
    window.removeEventListener("test", null, options);
  } catch (err) {}
  return passive;
};

/**
 * Returns a passive event listener option if supported
 */
export const passiveListener = passiveSupported() ? { passive: true } : false;

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
