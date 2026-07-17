import { listRooms, createRoom, updateRoom, deleteRoom } from '../api/rooms.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { initModals, openModal, closeModal, confirmDialog } from '../components/modal.js';
import { withLoading, setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { constants, fillSelect } from '../utils/constants.js';
import { escapeHtml, statusBadge } from '../utils/format.js';
import {
  applyFieldErrors,
  getFormValues,
  validateFields,
} from '../utils/validation.js';

const tableBody = document.getElementById('rooms-table-body');
const form = document.getElementById('room-form');
const addBtn = document.getElementById('add-room-btn');
const submitBtn = document.getElementById('room-submit');
const titleEl = document.getElementById('room-modal-title');

let rooms = [];

function boot() {
  fillSelect(document.getElementById('status'), constants.ROOM_STATUSES, {
    placeholder: 'Select status',
  });

  addBtn.addEventListener('click', () => openRoomModal());
  form.addEventListener('submit', onSave);
  tableBody.addEventListener('click', onTableClick);
  loadRooms();
}

async function loadRooms() {
  try {
    const response = await withLoading(() => listRooms(), 'Loading rooms…');
    const data = response.data;
    rooms = data?.rooms || data?.items || data || [];
    if (!Array.isArray(rooms)) rooms = [];
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Unable to load rooms.</td></tr>`;
    showToast(
      error instanceof ApiError ? error.message : 'Unable to load rooms.',
      'error',
    );
  }
}

function renderTable() {
  if (!rooms.length) {
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No rooms found. Add a room to get started.</td></tr>`;
    return;
  }

  tableBody.innerHTML = rooms
    .map((room) => {
      const id = room._id || room.id;
      return `
        <tr>
          <td>${escapeHtml(room.block)}</td>
          <td>${escapeHtml(room.roomNumber)}</td>
          <td>${escapeHtml(room.capacity)}</td>
          <td>${statusBadge(room.status)}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-id="${escapeHtml(id)}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${escapeHtml(id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function openRoomModal(room = null) {
  applyFieldErrors(form, {});
  form.reset();

  if (room) {
    titleEl.textContent = 'Edit Room';
    document.getElementById('room-id').value = room._id || room.id;
    document.getElementById('block').value = room.block || '';
    document.getElementById('roomNumber').value = room.roomNumber || '';
    document.getElementById('capacity').value = room.capacity ?? '';
    document.getElementById('status').value = room.status || '';
  } else {
    titleEl.textContent = 'Add Room';
    document.getElementById('room-id').value = '';
  }

  openModal('room');
}

async function onSave(event) {
  event.preventDefault();
  const values = getFormValues(form);
  values.capacity = values.capacity ? Number(values.capacity) : '';

  const { valid, errors } = validateFields(values, {
    block: { required: true, label: 'Block' },
    roomNumber: { required: true, label: 'Room Number' },
    capacity: {
      required: true,
      label: 'Capacity',
      custom: (value) => (Number(value) >= 1 ? null : 'Capacity must be at least 1.'),
    },
    status: { required: true, label: 'Status' },
  });

  applyFieldErrors(form, errors);
  if (!valid) return;

  const payload = {
    block: values.block,
    roomNumber: values.roomNumber,
    capacity: Number(values.capacity),
    status: values.status,
  };

  setButtonLoading(submitBtn, true, 'Saving…');
  try {
    if (values.id) {
      await updateRoom(values.id, payload);
      showToast('Room updated.', 'success');
    } else {
      await createRoom(payload);
      showToast('Room created.', 'success');
    }
    closeModal('room');
    loadRooms();
  } catch (error) {
    showToast(
      error instanceof ApiError ? error.message : 'Unable to save room.',
      'error',
    );
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function onTableClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  const room = rooms.find((r) => String(r._id || r.id) === String(id));

  if (action === 'edit' && room) {
    openRoomModal(room);
    return;
  }

  if (action === 'delete') {
    const confirmed = await confirmDialog({
      title: 'Delete room',
      message: `Delete Block ${room?.block} Room ${room?.roomNumber}? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await withLoading(() => deleteRoom(id), 'Deleting…');
      showToast('Room deleted.', 'success');
      loadRooms();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : 'Unable to delete room.',
        'error',
      );
    }
  }
}

const user = requireAuth({ superAdmin: true });
if (user) {
  initAdminShell();
  initModals();
  boot();
}
