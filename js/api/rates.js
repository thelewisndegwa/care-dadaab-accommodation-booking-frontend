import { api } from './client.js';

export function getRates() {
  return api.get('/rates');
}

export function updateRates(payload) {
  return api.put('/rates', payload);
}
