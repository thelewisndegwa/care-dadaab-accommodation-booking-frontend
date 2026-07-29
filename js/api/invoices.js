import { config } from '../config.js';
import { api } from './client.js';

export function listInvoices(params = {}) {
  return api.get('/invoices', { query: params });
}

export function getInvoice(id) {
  return api.get(`/invoices/${id}`);
}

export function updateInvoicePaymentStatus(id, paymentStatus) {
  return api.patch(`/invoices/${id}/payment-status`, { paymentStatus });
}
