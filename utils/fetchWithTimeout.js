const nodeFetch = require('node-fetch');
const AppError = require('./AppError');

/**
 * Utility function for making fetch requests with timeout capability
 * @param {string} url - The URL to fetch from
 * @param {object} options - Fetch options
 * @returns {Promise} - The fetch response
 * 
 * The function implements request timeouts using AbortController:
 * 
 * 1. AbortController:
 *    - Creates a new AbortController instance to manage request cancellation
 *    - The controller provides a way to abort fetch requests on demand
 * 
 * 2. Signal:
 *    - The controller.signal is a communication channel between the controller and fetch
 *    - When passed to fetch options, it allows fetch to listen for abort signals
 *    - If controller.abort() is called, the signal notifies fetch to cancel the request
 * 
 * 3. Timeout Implementation:
 *    - Sets a timeout that will call controller.abort() after 15 seconds
 *    - When aborted, fetch throws an AbortError which we catch and handle
 *    - The timeout is cleared if the request completes successfully or fails
 * 
 * This ensures requests don't hang indefinitely and resources are properly cleaned up.
 */
const fetchWithTimeout = async (url, options = {}) => {
  const timeout = 15000; // 15 seconds timeout
  const controller = new AbortController(); // Create controller to manage request lifecycle
  const id = setTimeout(() => controller.abort(), timeout); // Set timeout to abort request if it takes too long

  try {
    const response = await nodeFetch(url, {
      ...options,
      signal: controller.signal // Connect fetch to the abort controller through its signal
    });
    clearTimeout(id); // Clean up timeout since request completed

    if (!response.ok) {
      throw new AppError(`Failed to fetch data: ${response.statusText}`, response.status);
    }

    return response;
  } catch (error) {
    clearTimeout(id); // Clean up timeout on error
    if (error.name === 'AbortError') {
      throw new AppError('Request timeout. Please try again later.', 408);
    }
    throw error;
  }
};

module.exports = fetchWithTimeout;
