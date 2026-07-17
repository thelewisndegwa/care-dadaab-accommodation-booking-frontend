import { getDashboardStats } from '../api/dashboard.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { withLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';

const user = requireAuth();
if (!user) {
  /* redirect in progress */
} else {
  initAdminShell();
  loadStats();
}

async function loadStats() {
  try {
    const response = await withLoading(() => getDashboardStats(), 'Loading dashboard…');
    const stats = response.data || {};

    const mapping = {
      pendingReviews: stats.pendingReviews ?? stats.pendingReview ?? 0,
      approvedBookings: stats.approvedBookings ?? stats.approved ?? 0,
      checkedIn: stats.checkedIn ?? 0,
      checkedOut: stats.checkedOut ?? 0,
      cancellationRequests: stats.cancellationRequests ?? stats.cancellationRequested ?? 0,
      availableRooms: stats.availableRooms ?? stats.available ?? 0,
      occupiedRooms: stats.occupiedRooms ?? stats.occupied ?? 0,
      maintenanceRooms: stats.maintenanceRooms ?? stats.maintenance ?? 0,
    };

    Object.entries(mapping).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = String(value);
    });
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load dashboard stats.',
      'error',
    );
  }
}
