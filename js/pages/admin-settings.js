import { getSettings, updateSettings } from '../api/settings.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { withLoading, setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import {
  applyFieldErrors,
  getFormValues,
  isBlank,
  isValidEmail,
  validateFields,
} from '../utils/validation.js';

const form = document.getElementById('settings-form');
const submitBtn = document.getElementById('settings-submit');

async function loadSettings() {
  try {
    const response = await withLoading(() => getSettings(), 'Loading settings…');
    const settings = response.data?.settings || response.data || {};

    form.elements.facilityName.value = settings.facilityName || '';
    form.elements.supportEmail.value = settings.supportEmail || '';
    form.elements.supportPhone.value = settings.supportPhone || '';
    form.elements.bookingInstructions.value = settings.bookingInstructions || '';
    form.elements.bookingsEnabled.checked =
      settings.bookingsEnabled === undefined ? true : Boolean(settings.bookingsEnabled);
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load settings.',
      'error',
    );
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = getFormValues(form);
  values.bookingsEnabled = Boolean(form.elements.bookingsEnabled.checked);

  const { valid, errors } = validateFields(values, {
    supportEmail: {
      label: 'Support Email',
      custom: (value) =>
        isBlank(value) || isValidEmail(value) ? null : 'Enter a valid email address.',
    },
  });

  applyFieldErrors(form, errors);
  if (!valid) return;

  setButtonLoading(submitBtn, true, 'Saving…');
  try {
    await updateSettings({
      facilityName: values.facilityName || '',
      supportEmail: values.supportEmail || '',
      supportPhone: values.supportPhone || '',
      bookingInstructions: values.bookingInstructions || '',
      bookingsEnabled: values.bookingsEnabled,
    });
    showToast('Settings saved successfully.', 'success');
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to save settings.',
      'error',
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
});

const user = requireAuth({ superAdmin: true });
if (user) {
  initAdminShell();
  loadSettings();
}
