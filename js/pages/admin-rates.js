import { getRates, updateRates } from '../api/rates.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { withLoading, setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import {
  applyFieldErrors,
  getFormValues,
  validateFields,
} from '../utils/validation.js';

const form = document.getElementById('rates-form');
const submitBtn = document.getElementById('rates-submit');

async function loadRates() {
  try {
    const response = await withLoading(() => getRates(), 'Loading rates…');
    const rates = response.data?.rates || response.data || {};
    form.elements.currency.value = rates.currency || 'KES';
    form.elements.nightlyRate.value =
      rates.nightlyRate ?? rates.amount ?? rates.rate ?? '';
    form.elements.notes.value = rates.notes || '';
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load rates.',
      'error',
    );
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = getFormValues(form);
  values.nightlyRate = values.nightlyRate === '' ? '' : Number(values.nightlyRate);

  const { valid, errors } = validateFields(values, {
    nightlyRate: {
      required: true,
      label: 'Nightly Rate',
      custom: (value) =>
        Number(value) >= 0 ? null : 'Nightly rate must be zero or greater.',
    },
  });

  applyFieldErrors(form, errors);
  if (!valid) return;

  setButtonLoading(submitBtn, true, 'Saving…');
  try {
    await updateRates({
      currency: values.currency || 'KES',
      nightlyRate: Number(values.nightlyRate),
      notes: values.notes || '',
    });
    showToast('Rates updated successfully.', 'success');
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to update rates.',
      'error',
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

const user = requireAuth({ superAdmin: true });
if (user) {
  initAdminShell();
  loadRates();
}
