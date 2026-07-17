const BOOKING_STATUSES = [
  'Pending Review',
  'Approved',
  'Rejected',
  'Cancellation Requested',
  'Cancelled',
  'Checked In',
  'Checked Out',
];

const ROOM_STATUSES = ['Available', 'Occupied', 'Maintenance'];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const CONTRACT_TYPES = [
  'CARE Staff',
  'Consultant',
  'Partner Organisation',
  'Visitor',
  'Other',
];

const USER_ROLES = ['Accommodation Officer', 'Super Admin'];

export const constants = {
  BOOKING_STATUSES,
  ROOM_STATUSES,
  GENDERS,
  CONTRACT_TYPES,
  USER_ROLES,
};

export function fillSelect(select, options, { placeholder = 'Select…', value = '' } = {}) {
  if (!select) return;
  const items = options.map((opt) => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  select.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...items.map(
      (item) =>
        `<option value="${item.value}" ${String(item.value) === String(value) ? 'selected' : ''}>${item.label}</option>`,
    ),
  ].join('');
}
