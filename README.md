# Eye Care Booking App

Patients search a catalogue of services, clinics, and opticians, pick an open timeslot, and confirm the booking. Opticians sign in to see their upcoming schedule and open a patient's profile.

## Layout

- `backend` — Express and TypeScript REST API. Seed JSON lives in `backend/seed_data`. The API copies that seed into `backend/app_data` on first boot and writes bookings there.
- `frontend` — React, Vite, TypeScript, and Ant Design single-page app.

## Run

Requires Node.js 20 or newer.

```bash
cd backend
npm install
npm test
npm run dev
```

The API listens on http://localhost:3001.

```bash
cd frontend
npm install
npm run dev
```

The app is at http://localhost:5173 and proxies `/api` to the backend.

To run the production build as one process:

```bash
npm install --include=dev --prefix backend
npm install --include=dev --prefix frontend
npm run build
npm start
```

That serves the site and the API on the same port. `PORT` defaults to 3001.

Delete `backend/app_data` to restore the seed data.

## Sample logins

- Patient: `james@gmail.com` / `james`
- Optician: `mary@gmail.com` / `mary`

Wang Tang (`wtang4@gmail.com`) is a seeded patient on Mary's schedule. That account is not needed for the main journeys.

## Assumptions

- Clinics are open every day. The only bookable times are 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, and 17:00. Each slot lasts one hour.
- An optician may be employed by more than one clinic, but can only be booked at one clinic on a given calendar day. Other clinics show no free slots that day.
- A slot is unavailable when that optician already has an appointment at that exact time.
- A patient cannot hold two appointments at the same time.
- Times are clinic-local wall times (`YYYY-MM-DDTHH:mm:00`) with no timezone offset.
- Upcoming lists hide appointments that have already started. The optician patient dialog still shows full history.
- Appointments store `opticianId`. The booking rules need it, and the confirm request already sends it.
- Passwords in the seed files are plaintext only so the sample logins stay readable. The first boot stores bcrypt hashes in `app_data`. API responses never include passwords.
- `GET /users` and patient profiles require an optician token. Patients only receive their own appointments.
- A catalogue row exists only when the clinic employs the optician and the optician offers the service.

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Process health |
| POST | `/auth/login` | Public | Email and password, returns a 12-hour bearer token |
| GET | `/auth/me` | Any signed-in user | Current profile |
| GET | `/clinics` | Signed in | List clinics |
| POST | `/clinic` | Optician | Create a clinic with at least one optician |
| GET | `/opticians` | Signed in | List opticians |
| POST | `/optician` | Optician | Create an optician |
| GET | `/services` | Signed in | List services |
| POST | `/service` | Optician | Create a service |
| GET | `/users` | Optician | List users without password hashes |
| POST | `/user` | Optician | Create a user; password is hashed |
| GET | `/catalogue-table` | Signed in | Service, clinic, and optician rows. Query: `q`, `serviceId`, `clinicId`, `opticianId` |
| GET | `/availability` | Signed in | Query: `clinicId`, `opticianId`, `serviceId`, `year`, `month` |
| GET | `/appointments` | Signed in | Patient sees their own rows. Optician sees rows for their profile |
| POST | `/appointment` | Patient | Body: `clinicId`, `opticianId`, `serviceId`, `appointmentDatetime`, optional `notes` |
| GET | `/patients/:id` | Optician | Patient profile and appointment history |

Errors use `{ "error": "message" }` with 400 for invalid input, 401 for a missing or bad token, 403 for the wrong role, 404 when a record is missing, and 409 when a slot or email conflicts.

## Scripts

Backend: `npm run dev`, `npm run build`, `npm start`, `npm test`.

Frontend: `npm run dev`, `npm run build`, `npm run preview`.
