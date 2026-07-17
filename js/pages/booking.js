import { submitBooking } from '../api/bookings.js';
import { getPublicSettings } from '../api/settings.js';
import { ApiError } from '../api/client.js';
import { saveLastBookingReference } from '../auth/session.js';
import { initPublicNav } from '../components/shell.js';
import { setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { constants, fillSelect } from '../utils/constants.js';
import {
  applyFieldErrors,
  getFormValues,
  isArrivalValid,
  isDepartureAfterArrival,
  todayISODate,
  validateFields,
} from '../utils/validation.js';

initPublicNav();

const form = document.getElementById('booking-form');
const arrivalInput = document.getElementById('arrivalDate');
const departureInput = document.getElementById('departureDate');
const submitBtn = document.getElementById('booking-submit');
const closedAlert = document.getElementById('booking-closed');
const supportEl = document.getElementById('booking-support');
const instructionsEl = document.getElementById('booking-instructions');
let bookingsEnabled = true;

function renderSupportContact({ supportEmail, supportPhone }) {
  supportEl.replaceChildren(document.createTextNode('Please contact CARE Kenya'));

  if (supportEmail) {
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${supportEmail}`;
    emailLink.textContent = supportEmail;
    supportEl.append(' at ', emailLink);
  }

  if (supportPhone) {
    const phoneLink = document.createElement('a');
    phoneLink.href = `tel:${supportPhone}`;
    phoneLink.textContent = supportPhone;
    supportEl.append(supportEmail ? ' or ' : ' at ', phoneLink);
  }

  supportEl.append(' for assistance.');
}

async function loadPublicSettings() {
  try {
    const response = await getPublicSettings();
    const settings = response.data || {};

    if (settings.facilityName) {
      document.getElementById('facility-name').textContent = settings.facilityName;
    }

    if (settings.bookingInstructions) {
      instructionsEl.querySelector('p').textContent = settings.bookingInstructions;
      instructionsEl.hidden = false;
    }

    bookingsEnabled = settings.bookingsEnabled !== false;
    if (!bookingsEnabled) {
      renderSupportContact(settings);
      closedAlert.hidden = false;
      Array.from(form.elements).forEach((control) => {
        control.disabled = true;
      });
    }
  } catch {
    // Keep the form usable if settings cannot be loaded. The backend remains
    // authoritative and will reject submission when bookings are disabled.
  }
}

fillSelect(document.getElementById('gender'), constants.GENDERS, { placeholder: 'Select gender' });
fillSelect(document.getElementById('contractType'), constants.CONTRACT_TYPES, {
  placeholder: 'Select contract type',
});
loadPublicSettings();

const minDate = todayISODate();
arrivalInput.min = minDate;
departureInput.min = minDate;

arrivalInput.addEventListener('change', () => {
  if (arrivalInput.value) {
    departureInput.min = arrivalInput.value;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!bookingsEnabled) {
    showToast('Online booking is currently unavailable.', 'error');
    return;
  }

  const values = getFormValues(form);
  values.driverPickup = Boolean(form.elements.driverPickup?.checked);

  const { valid, errors } = validateFields(values, {
    firstName: { required: true, label: 'First Name' },
    lastName: { required: true, label: 'Last Name' },
    email: { required: true, email: true, label: 'Email' },
    phone: { required: true, phone: true, label: 'Phone' },
    organisation: { required: true, label: 'Organisation' },
    reasonForVisit: { required: true, label: 'Reason for Visit' },
    gender: { required: true, label: 'Gender' },
    contractType: { required: true, label: 'Contract Type' },
    arrivalDate: {
      required: true,
      label: 'Arrival Date',
      custom: (value) =>
        isArrivalValid(value) ? null : 'Arrival date must not be in the past.',
    },
    departureDate: {
      required: true,
      label: 'Departure Date',
      custom: (value, all) =>
        isDepartureAfterArrival(all.arrivalDate, value)
          ? null
          : 'Departure date must be after arrival date.',
    },
    departureCountry: { required: true, label: 'Departure Country' },
  });

  applyFieldErrors(form, errors);
  if (!valid) {
    showToast('Please correct the highlighted fields.', 'error');
    const firstInvalid = form.querySelector('.is-invalid');
    firstInvalid?.focus();
    return;
  }

  setButtonLoading(submitBtn, true, 'Submitting…');

  try {
    const response = await submitBooking({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      organisation: values.organisation,
      reasonForVisit: values.reasonForVisit,
      gender: values.gender,
      contractType: values.contractType,
      arrivalDate: values.arrivalDate,
      departureDate: values.departureDate,
      remarks: values.remarks || '',
      driverPickup: values.driverPickup,
      departureCountry: values.departureCountry,
    });

    const bookingReference =
      response?.data?.bookingReference ||
      response?.data?.booking?.bookingReference;

    if (bookingReference) {
      saveLastBookingReference(bookingReference);
      window.location.href = `booking-success.html?ref=${encodeURIComponent(bookingReference)}`;
      return;
    }

    showToast(response?.message || 'Booking submitted successfully.', 'success');
    window.location.href = 'booking-success.html';
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Unable to submit booking. Please try again.';
    showToast(message, 'error');

    if (error instanceof ApiError && error.errors?.length) {
      const fieldErrors = {};
      error.errors.forEach((item) => {
        if (item.field && item.message) {
          fieldErrors[item.field] = item.message;
        }
      });
      applyFieldErrors(form, fieldErrors);
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
