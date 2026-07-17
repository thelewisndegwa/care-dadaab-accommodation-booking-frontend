import { getLastBookingReference } from '../auth/session.js';
import { initPublicNav } from '../components/shell.js';
import { showToast } from '../components/toast.js';

initPublicNav();

const params = new URLSearchParams(window.location.search);
const reference = params.get('ref') || getLastBookingReference();

const referenceEl = document.getElementById('booking-reference');
const copyBtn = document.getElementById('copy-reference');
const trackLink = document.getElementById('track-booking-link');

if (reference) {
  referenceEl.textContent = reference;
  trackLink.href = `track-booking.html?ref=${encodeURIComponent(reference)}`;
} else {
  referenceEl.textContent = 'Not available';
  copyBtn.disabled = true;
  showToast('Booking reference not found. Check your confirmation email.', 'error');
}

copyBtn.addEventListener('click', async () => {
  if (!reference) return;
  try {
    await navigator.clipboard.writeText(reference);
    showToast('Booking reference copied.', 'success');
  } catch {
    // Fallback for older browsers / insecure contexts
    const input = document.createElement('input');
    input.value = reference;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    showToast('Booking reference copied.', 'success');
  }
});
