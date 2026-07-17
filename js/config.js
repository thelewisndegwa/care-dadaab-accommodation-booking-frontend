/**
 * Application configuration.
 * Update API_BASE_URL to point at the backend server.
 */
export const config = {
  API_BASE_URL: window.__API_BASE_URL__ || 'http://localhost:5000/api',
  APP_NAME: 'CARE Kenya Dadaab Accommodation',
  TOKEN_KEY: 'care_dadaab_token',
  USER_KEY: 'care_dadaab_user',
  BOOKING_REF_KEY: 'care_dadaab_last_booking_ref',
};
