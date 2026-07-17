import {
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  checkInBooking,
  checkOutBooking,
  approveCancellation,
  declineCancellation,
} from '../api/bookings.js';
import { listAvailableRooms, listBlocks } from '../api/rooms.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { initModals, openModal, closeModal, confirmDialog } from '../components/modal.js';
import { withLoading, setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { renderPagination } from '../components/pagination.js';
import { constants, fillSelect } from '../utils/constants.js';
import {
  escapeHtml,
  formatDate,
  formatDateTime,
  fullName,
  roomLabel,
  statusBadge,
  yesNo,
} from '../utils/format.js';
import { applyFieldErrors, validateFields } from '../utils/validation.js';

const state = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  sort: 'createdAt:desc',
  bookings: [],
  total: 0,
  totalPages: 1,
  approveContext: null,
  availableRooms: [],
};

const filtersForm = document.getElementById('bookings-filters');
const tableBody = document.getElementById('bookings-table-body');
const paginationEl = document.getElementById('bookings-pagination');
const approveForm = document.getElementById('approve-form');
const rejectForm = document.getElementById('reject-form');
const blockSelect = document.getElementById('approve-block');
const roomSelect = document.getElementById('approve-room');
const approveError = document.getElementById('approve-error');

function boot() {
  fillSelect(document.getElementById('status'), constants.BOOKING_STATUSES, {
    placeholder: 'All statuses',
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('status')) {
    document.getElementById('status').value = params.get('status');
    state.status = params.get('status');
  }

  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.search = filtersForm.elements.search.value.trim();
    state.status = filtersForm.elements.status.value;
    state.sort = filtersForm.elements.sort.value;
    state.page = 1;
    loadBookings();
  });

  tableBody.addEventListener('click', onTableAction);
  approveForm.addEventListener('submit', onApproveSubmit);
  rejectForm.addEventListener('submit', onRejectSubmit);
  blockSelect.addEventListener('change', onBlockChange);

  loadBookings();
}

async function loadBookings() {
  try {
    const [sortBy, sortOrder] = state.sort.split(':');
    const response = await withLoading(
      () =>
        listBookings({
          page: state.page,
          limit: state.limit,
          search: state.search,
          status: state.status,
          sortBy,
          sortOrder,
        }),
      'Loading bookings…',
    );

    const data = response.data || {};
    state.bookings = data.bookings || data.items || data || [];
    if (!Array.isArray(state.bookings)) state.bookings = [];

    state.total = data.total ?? state.bookings.length;
    state.totalPages = data.totalPages ?? Math.max(1, Math.ceil(state.total / state.limit));
    state.page = data.page ?? state.page;

    renderTable();
    renderPagination(
      paginationEl,
      {
        page: state.page,
        totalPages: state.totalPages,
        total: state.total,
        limit: state.limit,
      },
      (page) => {
        state.page = page;
        loadBookings();
      },
    );
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Unable to load bookings.</td></tr>`;
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load bookings.',
      'error',
    );
  }
}

function renderTable() {
  if (!state.bookings.length) {
    tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No bookings found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = state.bookings
    .map((booking) => {
      const id = booking._id || booking.id;
      return `
        <tr data-id="${escapeHtml(id)}">
          <td><strong>${escapeHtml(booking.bookingReference || '—')}</strong></td>
          <td>
            ${escapeHtml(fullName(booking))}<br>
            <span class="text-muted">${escapeHtml(booking.email || '')}</span>
          </td>
          <td>${escapeHtml(formatDate(booking.arrivalDate))}</td>
          <td>${escapeHtml(formatDate(booking.departureDate))}</td>
          <td>${statusBadge(booking.status)}</td>
          <td>${escapeHtml(roomLabel(booking.assignedRoom || booking.room))}</td>
          <td>
            <div class="table-actions">
              ${actionButtons(booking, id)}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function actionButtons(booking, id) {
  const buttons = [
    `<button type="button" class="btn btn-secondary btn-sm" data-action="view" data-id="${escapeHtml(id)}">View</button>`,
  ];

  if (booking.status === 'Pending Review') {
    buttons.push(
      `<button type="button" class="btn btn-primary btn-sm" data-action="approve" data-id="${escapeHtml(id)}">Approve</button>`,
      `<button type="button" class="btn btn-danger btn-sm" data-action="reject" data-id="${escapeHtml(id)}">Reject</button>`,
    );
  }

  if (booking.status === 'Approved') {
    buttons.push(
      `<button type="button" class="btn btn-primary btn-sm" data-action="check-in" data-id="${escapeHtml(id)}">Check In</button>`,
    );
  }

  if (booking.status === 'Checked In') {
    buttons.push(
      `<button type="button" class="btn btn-primary btn-sm" data-action="check-out" data-id="${escapeHtml(id)}">Check Out</button>`,
    );
  }

  if (booking.status === 'Cancellation Requested') {
    buttons.push(
      `<button type="button" class="btn btn-primary btn-sm" data-action="approve-cancel" data-id="${escapeHtml(id)}">Approve Cancel</button>`,
      `<button type="button" class="btn btn-secondary btn-sm" data-action="decline-cancel" data-id="${escapeHtml(id)}">Decline Cancel</button>`,
    );
  }

  return buttons.join('');
}

async function onTableAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  const booking = state.bookings.find((b) => String(b._id || b.id) === String(id));

  switch (action) {
    case 'view':
      await openDetails(id);
      break;
    case 'approve':
      await openApproveModal(booking || (await fetchBooking(id)));
      break;
    case 'reject':
      document.getElementById('reject-booking-id').value = id;
      document.getElementById('reject-reason').value = '';
      openModal('reject');
      break;
    case 'check-in':
      await runAction(
        () => checkInBooking(id),
        'Check this guest in?',
        'Guest checked in.',
      );
      break;
    case 'check-out':
      await runAction(
        () => checkOutBooking(id),
        'Check this guest out?',
        'Guest checked out.',
      );
      break;
    case 'approve-cancel':
      await runAction(
        () => approveCancellation(id),
        'Approve this cancellation request?',
        'Cancellation approved.',
        true,
      );
      break;
    case 'decline-cancel':
      await runAction(
        () => declineCancellation(id),
        'Decline this cancellation request?',
        'Cancellation declined.',
      );
      break;
    default:
      break;
  }
}

async function fetchBooking(id) {
  const response = await getBooking(id);
  return response.data?.booking || response.data;
}

async function openDetails(id) {
  try {
    const booking = await withLoading(() => fetchBooking(id), 'Loading details…');
    const list = document.getElementById('details-list');
    const timeline = document.getElementById('details-timeline');

    list.innerHTML = [
      detail('Booking Reference', booking.bookingReference),
      detailHtml('Status', statusBadge(booking.status)),
      detail('Guest', fullName(booking)),
      detail('Email', booking.email),
      detail('Phone', booking.phone),
      detail('Organisation', booking.organisation),
      detail('Gender', booking.gender),
      detail('Contract Type', booking.contractType),
      detail('Arrival', formatDate(booking.arrivalDate)),
      detail('Departure', formatDate(booking.departureDate)),
      detail('Assigned Room', roomLabel(booking.assignedRoom || booking.room)),
      detail('Driver Pickup', yesNo(booking.driverPickup)),
      detail('Departure Country', booking.departureCountry),
      detail('Reason for Visit', booking.reasonForVisit),
      detail('Remarks', booking.remarks || '—'),
    ].join('');

    const events = booking.timeline || booking.auditTimeline || [];
    timeline.innerHTML = events.length
      ? `<h3 style="font-size:var(--text-base);">Timeline</h3>
         <ul>${events
           .map(
             (entry) =>
               `<li><strong>${escapeHtml(entry.event || entry.action || entry.status || 'Event')}</strong>
                — ${escapeHtml(formatDateTime(entry.at || entry.createdAt || entry.timestamp))}
                ${entry.note || entry.message ? ` · ${escapeHtml(entry.note || entry.message)}` : ''}</li>`,
           )
           .join('')}</ul>`
      : '';

    openModal('details');
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load booking details.',
      'error',
    );
  }
}

function detail(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? '—')}</dd></div>`;
}

function detailHtml(label, html) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${html}</dd></div>`;
}

async function openApproveModal(booking) {
  if (!booking) return;

  state.approveContext = booking;
  document.getElementById('approve-booking-id').value = booking._id || booking.id;
  document.getElementById('approve-guest-summary').textContent =
    `${fullName(booking)} · ${formatDate(booking.arrivalDate)} → ${formatDate(booking.departureDate)}`;
  approveError.hidden = true;
  approveError.textContent = '';
  applyFieldErrors(approveForm, {});

  roomSelect.innerHTML = '<option value="">Select block first</option>';
  roomSelect.disabled = true;

  try {
    const blocksResponse = await withLoading(() => listBlocks(), 'Loading rooms…');
    const blocks = blocksResponse.data?.blocks || blocksResponse.data || [];
    const blockOptions = (Array.isArray(blocks) ? blocks : []).map((b) =>
      typeof b === 'string' ? b : b.block || b.name,
    );

    fillSelect(blockSelect, blockOptions, { placeholder: 'Select block' });
    openModal('approve');
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load blocks.',
      'error',
    );
  }
}

async function onBlockChange() {
  const block = blockSelect.value;
  roomSelect.innerHTML = '<option value="">Loading rooms…</option>';
  roomSelect.disabled = true;
  approveError.hidden = true;

  if (!block || !state.approveContext) {
    roomSelect.innerHTML = '<option value="">Select block first</option>';
    return;
  }

  try {
    const response = await listAvailableRooms({
      block,
      arrivalDate: state.approveContext.arrivalDate,
      departureDate: state.approveContext.departureDate,
    });

    const rooms = response.data?.rooms || response.data || [];
    state.availableRooms = Array.isArray(rooms) ? rooms : [];

    if (!state.availableRooms.length) {
      roomSelect.innerHTML = '<option value="">No available rooms in this block</option>';
      return;
    }

    fillSelect(
      roomSelect,
      state.availableRooms.map((room) => ({
        value: room._id || room.id,
        label: `Room ${room.roomNumber}${room.capacity ? ` (cap ${room.capacity})` : ''}`,
      })),
      { placeholder: 'Select room' },
    );
    roomSelect.disabled = false;
  } catch (error) {
    roomSelect.innerHTML = '<option value="">Unable to load rooms</option>';
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load available rooms.',
      'error',
    );
  }
}

async function onApproveSubmit(event) {
  event.preventDefault();
  const bookingId = document.getElementById('approve-booking-id').value;
  const block = blockSelect.value;
  const roomId = roomSelect.value;
  const submitBtn = document.getElementById('approve-submit');

  const { valid, errors } = validateFields(
    { block, roomId },
    {
      block: { required: true, label: 'Block' },
      roomId: { required: true, label: 'Room' },
    },
  );

  applyFieldErrors(approveForm, errors);
  approveError.hidden = true;

  if (!valid) return;

  const selectedRoom = state.availableRooms.find(
    (room) => String(room._id || room.id) === String(roomId),
  );

  setButtonLoading(submitBtn, true, 'Approving…');
  try {
    await approveBooking(bookingId, {
      block,
      roomId,
      roomNumber: selectedRoom?.roomNumber,
    });
    closeModal('approve');
    showToast('Booking approved and room assigned.', 'success');
    loadBookings();
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Unable to approve booking.';
    approveError.textContent = message;
    approveError.hidden = false;
    showToast(message, 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function onRejectSubmit(event) {
  event.preventDefault();
  const bookingId = document.getElementById('reject-booking-id').value;
  const reason = document.getElementById('reject-reason').value.trim();
  const submitBtn = document.getElementById('reject-submit');

  setButtonLoading(submitBtn, true, 'Rejecting…');
  try {
    await rejectBooking(bookingId, { reason: reason || undefined });
    closeModal('reject');
    showToast('Booking rejected.', 'success');
    loadBookings();
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to reject booking.',
      'error',
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function runAction(actionFn, confirmMessage, successMessage, danger = false) {
  const confirmed = await confirmDialog({
    title: 'Confirm action',
    message: confirmMessage,
    confirmLabel: 'Confirm',
    danger,
  });
  if (!confirmed) return;

  try {
    await withLoading(actionFn, 'Updating…');
    showToast(successMessage, 'success');
    loadBookings();
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Action failed.',
      'error',
    );
  }
}

const user = requireAuth();
if (user) {
  initAdminShell();
  initModals();
  boot();
}
