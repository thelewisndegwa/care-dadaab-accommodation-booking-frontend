import { trackBooking, requestCancellation } from '../api/bookings.js';
import { ApiError } from '../api/client.js';
import { initPublicNav } from '../components/shell.js';
import { initModals, openModal, closeModal } from '../components/modal.js';
import { setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { formatDate, roomLabel, statusBadge, escapeHtml } from '../utils/format.js';
import {
  applyFieldErrors,
  getFormValues,
  validateFields,
} from '../utils/validation.js';

initPublicNav();
initModals();

const form = document.getElementById('track-form');
const submitBtn = document.getElementById('track-submit');
const resultEl = document.getElementById('track-result');
const detailsEl = document.getElementById('booking-details');
const cancellationActions = document.getElementById('cancellation-actions');
const cancellationSuccess = document.getElementById('cancellation-success');
const requestBtn = document.getElementById('request-cancellation-btn');
const confirmBtn = document.getElementById('confirm-cancellation-btn');
const reasonInput = document.getElementById('cancellationReason');

let currentLookup = null;
let currentBooking = null;

const params = new URLSearchParams(window.location.search);
const prefRef = params.get('ref');
if (prefRef) {
  form.elements.bookingReference.value = prefRef;
}

const CANCELLABLE = new Set(['Pending Review', 'Approved']);

function renderDetails(booking) {
  const assignedRoom = booking.assignedRoom || booking.room;
  detailsEl.innerHTML = `
    <div>
      <dt>Status</dt>
      <dd>${statusBadge(booking.status)}</dd>
    </div>
    <div>
      <dt>Booking Reference</dt>
      <dd>${escapeHtml(booking.bookingReference)}</dd>
    </div>
    <div>
      <dt>Arrival</dt>
      <dd>${escapeHtml(formatDate(booking.arrivalDate))}</dd>
    </div>
    <div>
      <dt>Departure</dt>
      <dd>${escapeHtml(formatDate(booking.departureDate))}</dd>
    </div>
    <div>
      <dt>Assigned Room</dt>
      <dd>${escapeHtml(roomLabel(assignedRoom))}</dd>
    </div>
  `;

  resultEl.hidden = false;
  cancellationSuccess.hidden = true;

  const canCancel = CANCELLABLE.has(booking.status);
  cancellationActions.hidden = !canCancel;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = getFormValues(form);

  const { valid, errors } = validateFields(values, {
    bookingReference: { required: true, label: 'Booking Reference' },
    email: { required: true, email: true, label: 'Email Address' },
  });

  applyFieldErrors(form, errors);
  if (!valid) {
    showToast('Please correct the highlighted fields.', 'error');
    return;
  }

  setButtonLoading(submitBtn, true, 'Searching…');
  resultEl.hidden = true;

  try {
    const response = await trackBooking({
      bookingReference: values.bookingReference,
      email: values.email,
    });

    currentLookup = {
      bookingReference: values.bookingReference,
      email: values.email,
    };
    currentBooking = response.data?.booking || response.data;
    renderDetails(currentBooking);
  } catch (error) {
    currentBooking = null;
    currentLookup = null;
    showToast(
      error instanceof ApiError ? error.message : 'Unable to find this booking.',
      'error',
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

requestBtn.addEventListener('click', () => {
  reasonInput.value = '';
  openModal('cancellation');
});

confirmBtn.addEventListener('click', async () => {
  if (!currentLookup) return;

  setButtonLoading(confirmBtn, true, 'Submitting…');
  try {
    await requestCancellation({
      bookingReference: currentLookup.bookingReference,
      email: currentLookup.email,
      reason: reasonInput.value.trim() || undefined,
    });

    closeModal('cancellation');
    cancellationActions.hidden = true;
    cancellationSuccess.hidden = false;

    if (currentBooking) {
      currentBooking.status = 'Cancellation Requested';
      renderDetails(currentBooking);
      cancellationSuccess.hidden = false;
      cancellationActions.hidden = true;
    }

    showToast('Cancellation request submitted successfully.', 'success');
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to submit cancellation request.',
      'error',
    );
  } finally {
    setButtonLoading(confirmBtn, false);
  }
});
