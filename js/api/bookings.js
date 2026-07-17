import { api } from './client.js';

/** Public: submit a guest booking request. */
export function submitBooking(payload) {
  return api.post('/bookings', payload, { auth: false });
}

/** Public: track a booking by reference + email. */
export function trackBooking({ bookingReference, email }) {
  return api.post('/bookings/track', { bookingReference, email }, { auth: false });
}

/** Public: request cancellation for a booking. */
export function requestCancellation({ bookingReference, email, reason }) {
  return api.post(
    '/bookings/cancellation-request',
    { bookingReference, email, reason },
    { auth: false },
  );
}

/** Admin: list bookings with search, filter, sort, pagination. */
export function listBookings(params = {}) {
  return api.get('/bookings', { query: params });
}

export function getBooking(id) {
  return api.get(`/bookings/${id}`);
}

/** Approve booking and assign room in one action. */
export function approveBooking(id, { block, roomId, roomNumber }) {
  return api.post(`/bookings/${id}/approve`, { block, roomId, roomNumber });
}

export function rejectBooking(id, { reason } = {}) {
  return api.post(`/bookings/${id}/reject`, { reason });
}

export function checkInBooking(id) {
  return api.post(`/bookings/${id}/check-in`);
}

export function checkOutBooking(id) {
  return api.post(`/bookings/${id}/check-out`);
}

export function approveCancellation(id) {
  return api.post(`/bookings/${id}/cancellation/approve`);
}

export function declineCancellation(id, { reason } = {}) {
  return api.post(`/bookings/${id}/cancellation/decline`, { reason });
}
