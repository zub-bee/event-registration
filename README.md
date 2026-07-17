# Event Registration + QR Check-In

A tested, working scaffold for: registration form → capacity limit (100) →
emailed QR ticket → staff login → scan-to-check-in (one-time use) → admin
dashboard.


## How it works

- **Storage:** `data/app.db` — a SQLite file.
- **Auth:** Staff (scanner + admin) log in with a username/password →
  get a JWT → send it as `Authorization: Bearer <token>` on protected
  requests. Public registration has no login.
- **QR codes:** Each registrant gets a random unique token (not their
  email so it's safer). The token is encoded into a QR image and emailed.
  Scanning looks the token up and flips it from `unused` → `used`.
  Scanning it again is rejected.

## Project structure

```
src/
  server.js          - wires everything together
  db.js              - JSON-file "database" (registrations + staff users)
  seed.js             - creates your staff login (run once)
  middleware/auth.js  - checks the JWT on protected routes
  routes/
    register.js       - POST /api/register, GET /api/status
    auth.js            - POST /api/auth/login
    checkin.js          - POST /api/checkin
    admin.js             - GET /api/admin/registrations
  services/
    qrcode.js          - generates the QR PNG
    email.js            - sends the ticket email
public/
  index.html    - registration form
  success.html   - "you're registered" page
  login.html      - staff login (used by both scanner & admin)
  scanner.html     - camera scanner (uses html5-qrcode via CDN)
  admin.html        - live registrant table
```

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `JWT_SECRET` — any long random string
- `STAFF_USERNAME` / `STAFF_PASSWORD` — the login the two scanning staff
  will use
- `SMTP_*` — your email provider's SMTP details

Create the staff login:
```bash
npm run seed
```

Start the server:
```bash
npm start
```

Then open:
- `http://localhost:3000` — registration form
- `http://localhost:3000/login.html` — staff login
- `http://localhost:3000/scanner.html` — scanner
- `http://localhost:3000/admin.html` — admin dashboard

## Setting up real email

Any SMTP provider works. Easiest options:
- **Gmail:** use an App Password to enable
  2FA on the Google account first, then generate one in account security
  settings. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.
- **Resend / SendGrid / Mailgun:** sign up, verify a sender, use the SMTP
  credentials they give you.
  hood, just without the ORM.
- `middleware/auth.js` is a classic Express pattern: a function that
  runs before your route handler and can block the request.
- If you want to level up this project later: rate-limiting on
  `/api/register`, moving to a real database, adding more staff
  accounts, or a "resend my ticket" endpoint are all natural next steps.
