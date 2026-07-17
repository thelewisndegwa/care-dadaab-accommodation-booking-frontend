/** Display / formatting helpers. */

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return DATETIME_FORMATTER.format(date);
}

export function formatMoney(amount, currency = 'KES') {
  if (amount === null || amount === undefined || amount === '') return '—';
  const number = Number(amount);
  if (Number.isNaN(number)) return String(amount);
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(number);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function statusBadgeClass(status) {
  const map = {
    'Pending Review': 'badge-pending',
    Approved: 'badge-approved',
    Rejected: 'badge-rejected',
    'Cancellation Requested': 'badge-cancellation',
    Cancelled: 'badge-cancelled',
    'Checked In': 'badge-checked-in',
    'Checked Out': 'badge-checked-out',
    Available: 'badge-available',
    Occupied: 'badge-occupied',
    Maintenance: 'badge-maintenance',
  };
  return map[status] || 'badge-cancelled';
}

export function statusBadge(status) {
  if (!status) return '—';
  return `<span class="badge ${statusBadgeClass(status)}">${escapeHtml(status)}</span>`;
}

export function roomLabel(room) {
  if (!room) return '—';
  if (typeof room === 'string') return room;
  const block = room.block || '';
  const number = room.roomNumber ?? room.number ?? '';
  if (block && number !== '') return `Block ${block} · Room ${number}`;
  if (number !== '') return `Room ${number}`;
  return block || '—';
}

export function fullName(person) {
  if (!person) return '—';
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || '—';
}

export function yesNo(value) {
  if (value === true || value === 'true' || value === 'Yes') return 'Yes';
  if (value === false || value === 'false' || value === 'No') return 'No';
  return value ? String(value) : '—';
}
