import { api } from './client.js';

export function listRooms(params = {}) {
  return api.get('/rooms', { query: params });
}

export function getRoom(id) {
  return api.get(`/rooms/${id}`);
}

export function createRoom(payload) {
  return api.post('/rooms', payload);
}

export function updateRoom(id, payload) {
  return api.put(`/rooms/${id}`, payload);
}

export function deleteRoom(id) {
  return api.delete(`/rooms/${id}`);
}

/** Rooms available for assignment during a date range. */
export function listAvailableRooms(params = {}) {
  return api.get('/rooms/available', { query: params });
}

export function listBlocks() {
  return api.get('/rooms/blocks');
}
