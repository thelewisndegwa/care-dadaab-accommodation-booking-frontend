# CARE Kenya Dadaab Accommodation Booking — Frontend

Vanilla HTML, CSS, and modular JavaScript frontend for the CARE Kenya Dadaab Accommodation Booking System.

Consumes a REST API. No backend code lives in this repository.

## Stack

- HTML
- CSS
- Vanilla JavaScript (ES modules)
- Fetch API

## Pages

### Public

| Page | File |
|------|------|
| Home | `index.html` |
| Accommodation Booking | `booking.html` |
| Booking Submitted | `booking-success.html` |
| Track Booking | `track-booking.html` |
| Terms & Conditions | `terms.html` |

### Admin

| Page | File | Access |
|------|------|--------|
| Login | `admin/login.html` | Public |
| Dashboard | `admin/dashboard.html` | Staff |
| Bookings | `admin/bookings.html` | Staff |
| Rooms | `admin/rooms.html` | Super Admin |
| Rates | `admin/rates.html` | Super Admin |
| Users | `admin/users.html` | Super Admin |
| Settings | `admin/settings.html` | Super Admin |

## Setup

1. Serve this folder with any static file server (ES modules require HTTP, not `file://`).

```bash
npx serve .
# or
python -m http.server 3000
```

2. Point the frontend at your backend API in `js/config.js`:

```js
API_BASE_URL: 'http://localhost:5000/api'
```

Or override at runtime before modules load:

```html
<script>window.__API_BASE_URL__ = 'https://api.example.com/api';</script>
```

## Project structure

```
css/           Design system and layout
js/config.js   API base URL and app constants
js/api/        REST API wrappers (no UI)
js/auth/       Session / JWT helpers
js/components/ Toast, modal, loading, pagination, shell
js/utils/      Validation, formatting, constants
js/pages/      Page-specific UI logic
admin/         Admin HTML pages
```

## Expected API endpoints

The frontend expects JSON responses in this shape:

```json
{ "success": true, "message": "…", "data": {} }
{ "success": false, "message": "…", "errors": [] }
```

Authenticated requests send `Authorization: Bearer <token>`.

### Auth

- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `GET /auth/me`

### Public bookings

- `POST /bookings` — guest booking payload
- `POST /bookings/track` — `{ bookingReference, email }`
- `POST /bookings/cancellation-request` — `{ bookingReference, email, reason? }`

### Admin bookings

- `GET /bookings?page&limit&search&status&sortBy&sortOrder`
- `GET /bookings/:id`
- `POST /bookings/:id/approve` — `{ block, roomId, roomNumber? }`
- `POST /bookings/:id/reject` — `{ reason? }`
- `POST /bookings/:id/check-in`
- `POST /bookings/:id/check-out`
- `POST /bookings/:id/cancellation/approve`
- `POST /bookings/:id/cancellation/decline` — `{ reason? }`

### Dashboard

- `GET /dashboard/stats`

### Rooms

- `GET /rooms`
- `GET /rooms/blocks`
- `GET /rooms/available?block&arrivalDate&departureDate`
- `POST /rooms`
- `PUT /rooms/:id`
- `DELETE /rooms/:id`

### Rates / Users / Settings (Super Admin)

- `GET|PUT /rates`
- `GET|POST /users` · `PUT|DELETE /users/:id`
- `GET /settings/public` (public, non-sensitive facility settings)
- `GET|PUT /settings`

Align field names with `system-contract.md` (camelCase).

## Roles

- **Guest** — book, track, request cancellation (no login)
- **Accommodation Officer** — dashboard, bookings workflow
- **Super Admin** — everything above, plus rooms, rates, users, settings
