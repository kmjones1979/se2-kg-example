/**
 * Export test utilities for API endpoint verification
 */
export { testEndpoints } from "./test-api";

/**
 * This module helps verify which Graph API endpoint patterns work.
 *
 * To use in the browser console:
 * 1. Import the module
 * 2. Call the test function:
 *
 *    window.testGraphEndpoints()
 *
 * Or simply visit a page and run in the console:
 *
 *    await import('/api/new-log').then(m => m.testEndpoints())
 */
