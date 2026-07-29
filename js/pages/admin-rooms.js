import { listCamps } from '../api/camps.js';
import { listBlocks } from '../api/blocks.js';
import { listRooms, createRoom, updateRoom, deleteRoom, reactivateRoom } from '../api/rooms.js';
import { ApiError } from '../api/client.js';
import { requireAuth } from '../auth/session.js';
import { initAdminShell } from '../components/shell.js';
import { initModals, openModal, closeModal, confirmDialog } from '../components/modal.js';
import { withLoading, setButtonLoading } from '../components/loading.js';
import { showToast } from '../components/toast.js';
import { constants, fillSelect } from '../utils/constants.js';
import { escapeHtml, campLabel, statusBadge } from '../utils/format.js';
import { applyFieldErrors, getFormValues, validateFields } from '../utils/validation.js';

const tableBody = document.getElementById('rooms-table-body');
const form = document.getElementById('room-form');
const filterCamp = document.getElementById('filter-camp');
const filterBlock = document.getElementById('filter-block');
const addBtn = document.getElementById('add-room-btn');
const submitBtn = document.getElementById('room-submit');
const titleEl = document.getElementById('room-modal-title');
const formCampSelect = document.getElementById('campId');
const formBlockSelect = document.getElementById('blockId');

let rooms = [];
let camps = [];
let blocks = [];

function boot() {
  fillSelect(document.getElementById('status'), constants.ROOM_STATUSES, {
    placeholder: 'Select status',
  });

  addBtn.addEventListener('click', () => openRoomModal());
  form.addEventListener('submit', onSave);
  tableBody.addEventListener('click', onTableClick);
  filterCamp.addEventListener('change', () => loadBlocksForFilter(filterCamp.value));
  filterBlock.addEventListener('change', loadRooms);
  formCampSelect.addEventListener('change', () => loadBlocksForForm(formCampSelect.value));
  loadCamps();
}

async function loadCamps() {
  try {
    const response = await listCamps({ includeInactive: 'true' });
    camps = response.data?.camps || response.data?.items || response.data || [];
    if (!Array.isArray(camps)) camps = [];
    const options = camps.map((c) => ({ value: c._id || c.id, label: c.name || c.campName }));
    fillSelect(filterCamp, options, { placeholder: 'All camps' });
    fillSelect(
      formCampSelect,
      camps.filter((c) => c.isActive !== false).map((c) => ({ value: c._id || c.id, label: c.name || c.campName })),
      { placeholder: 'Select camp' },
    );
    loadRooms();
  } catch {
    showToast('Unable to load camps.', 'error');
  }
}

async function loadBlocksForFilter(campId) {
  if (!campId) {
    fillSelect(filterBlock, [], { placeholder: 'All blocks' });
    loadRooms();
    return;
  }
  const response = await listBlocks(campId, { includeInactive: 'true' });
  const items = response.data?.blocks || response.data?.items || response.data || [];
  fillSelect(
    filterBlock,
    (Array.isArray(items) ? items : []).map((b) => ({
      value: b._id || b.id,
      label: b.name || b.blockName || b.block,
    })),
    { placeholder: 'All blocks' },
  );
  loadRooms();
}

async function loadBlocksForForm(campId, selectedBlockId = '') {
  formBlockSelect.innerHTML = '<option value="">Select camp first</option>';
  formBlockSelect.disabled = !campId;
  if (!campId) return;

  const response = await listBlocks(campId, { includeInactive: 'true' });
  const items = response.data?.blocks || response.data?.items || response.data || [];
  fillSelect(
    formBlockSelect,
    (Array.isArray(items) ? items : [])
      .filter((b) => b.isActive !== false)
      .map((b) => ({
        value: b._id || b.id,
        label: b.name || b.blockName || b.block,
      })),
    { placeholder: 'Select block', value: selectedBlockId },
  );
  formBlockSelect.disabled = false;
}

async function loadRooms() {
  try {
    const query = { includeInactive: 'true' };
    if (filterCamp.value) query.campId = filterCamp.value;
    if (filterBlock.value) query.blockId = filterBlock.value;

    const response = await withLoading(() => listRooms(query), 'Loading rooms…');
    rooms = response.data?.rooms || response.data?.items || response.data || [];
    if (!Array.isArray(rooms)) rooms = [];
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Unable to load rooms.</td></tr>`;
    showToast(error instanceof ApiError ? error.message : 'Unable to load rooms.', 'error');
  }
}

function renderTable() {
  if (!rooms.length) {
    tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No rooms found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = rooms
    .map((room) => {
      const id = room._id || room.id;
      const active = room.isActive !== false;
      const recordBadge = active
        ? '<span class="badge badge-approved">Active</span>'
        : '<span class="badge badge-cancelled">Inactive</span>';
      const toggleButton = active
        ? `<button type="button" class="btn btn-danger btn-sm" data-action="deactivate" data-id="${escapeHtml(id)}">Deactivate</button>`
        : `<button type="button" class="btn btn-primary btn-sm" data-action="reactivate" data-id="${escapeHtml(id)}">Reactivate</button>`;
      return `
        <tr>
          <td>${escapeHtml(campLabel(room.camp))}</td>
          <td>${escapeHtml(room.block?.name || room.blockName || room.block || '—')}</td>
          <td>${escapeHtml(room.roomNumber)}</td>
          <td>${escapeHtml(room.capacity)}</td>
          <td>${statusBadge(room.status)}</td>
          <td>${recordBadge}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-id="${escapeHtml(id)}">Edit</button>
              ${toggleButton}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function openRoomModal(room = null) {
  applyFieldErrors(form, {});
  form.reset();

  if (room) {
    titleEl.textContent = 'Edit Room';
    document.getElementById('room-id').value = room._id || room.id;
    const campId = room.campId || room.camp?._id || room.camp?.id;
    const blockId = room.blockId || room.block?._id || room.block?.id;
    formCampSelect.value = campId || '';
    await loadBlocksForForm(campId, blockId);
    document.getElementById('roomNumber').value = room.roomNumber || '';
    document.getElementById('capacity').value = room.capacity ?? '';
    document.getElementById('status').value = room.status || '';
  } else {
    titleEl.textContent = 'Add Room';
    document.getElementById('room-id').value = '';
    if (filterCamp.value) {
      formCampSelect.value = filterCamp.value;
      await loadBlocksForForm(filterCamp.value, filterBlock.value);
    }
  }
  openModal('room');
}

async function onSave(event) {
  event.preventDefault();
  const values = getFormValues(form);
  values.capacity = values.capacity ? Number(values.capacity) : '';

  const { valid, errors } = validateFields(values, {
    campId: { required: true, label: 'Camp' },
    blockId: { required: true, label: 'Block' },
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
    campId: values.campId,
    blockId: values.blockId,
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
    showToast(error instanceof ApiError ? error.message : 'Unable to save room.', 'error');
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
    await openRoomModal(room);
    return;
  }

  if (action === 'deactivate') {
    const confirmed = await confirmDialog({
      title: 'Deactivate room',
      message: `Deactivate room ${room?.roomNumber}?`,
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await withLoading(() => deleteRoom(id), 'Deactivating…');
      showToast('Room deactivated.', 'success');
      loadRooms();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to deactivate room.', 'error');
    }
    return;
  }

  if (action === 'reactivate') {
    try {
      await withLoading(() => reactivateRoom(id), 'Reactivating…');
      showToast('Room reactivated.', 'success');
      loadRooms();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Unable to reactivate room.', 'error');
    }
  }
}

const user = requireAuth({ superAdmin: true });
if (user) {
  initAdminShell();
  initModals();
  boot();
}
