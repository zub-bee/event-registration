# Event Registration + QR Check-In

A tested, working scaffold for: registration form → capacity limit (100) →
emailed QR ticket → staff login → scan-to-check-in (one-time use) → admin
dashboard.

Everything is plain JavaScript/Express — no framework magic, so it's a good
project to actually read and understand line by line.

## How it works

- **Storage:** `data/db.json` — a plain JSON file. No database server to
  install. Fine for 100 registrants. (Swap for Postgres/Mongo later if you
  outgrow it — only `src/db.js` would need to change.)
- **Auth:** Staff (scanner + admin) log in with a username/password →
  get a JWT → send it as `Authorization: Bearer <token>` on protected
  requests. Public registration has no login.
- **QR codes:** Each registrant gets a random unique token (not their
  email — safer). The token is encoded into a QR image and emailed.
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
- `STAFF_USERNAME` / `STAFF_PASSWORD` — the login your two scanning staff
  will use (both people can share one login, or you can add more staff
  users later by editing `data/db.json` or extending `seed.js`)
- `SMTP_*` — your email provider's SMTP details (see below). **You can
  leave these blank while developing** — emails just get logged to the
  console instead of sent, so you can build the whole flow first and
  wire up real email last.

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
- `http://localhost:3000/scanner.html` — scanner (open this on each phone)
- `http://localhost:3000/admin.html` — admin dashboard

## Setting up real email

Any SMTP provider works. Easiest options:
- **Gmail:** use an "App Password" (not your normal password) — enable
  2FA on the Google account first, then generate one in account security
  settings. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.
- **Resend / SendGrid / Mailgun:** sign up, verify a sender, use the SMTP
  credentials they give you. These are built for this and less likely to
  get flagged as spam than personal Gmail for bulk sending.

## Deploying (so it's live before the event)

- **Backend:** push this folder to a GitHub repo, deploy on
  [Render](https://render.com) or [Railway](https://railway.app) (both
  have free tiers). Set your `.env` values as environment variables in
  their dashboard — don't commit `.env` to git.
- One thing to know: on some free hosts the filesystem resets on
  redeploy, which would wipe `data/db.json`. If that matters for you
  (it will, since you don't want to lose registrants), either:
  - pick a host with a persistent disk (Render's free tier supports
    a small persistent disk), or
  - migrate `db.js` to a hosted database before the real event.
  For a 2-week build + one event, a persistent-disk host is the
  simplest fix — flag it to me if you want a hand with either.

## Testing the flow yourself before the event

1. Register with a real email you can check.
2. Confirm you get the email with the QR attached.
3. Log in on `login.html`, then open `scanner.html` and scan the QR
   from your email (on your phone screen or printed).
4. Confirm it shows ✅ Valid, then scan the *same* QR again — confirm
   it shows ❌ Already scanned.
5. Check `admin.html` shows the registrant as checked in.
6. Temporarily set `EVENT_CAPACITY=1` in `.env`, restart, register once,
   and confirm the form shows "closed" and a second registration is
   rejected. Set it back to 100 (or your real number) afterward.

## Notes for learning

- `db.js` is intentionally simple so you can read the whole thing in a
  few minutes — it's a good example of what an ORM is doing under the
  hood, just without the ORM.
- `middleware/auth.js` is a classic Express pattern: a function that
  runs before your route handler and can block the request.
- If you want to level up this project later: rate-limiting on
  `/api/register`, moving to a real database, adding more staff
  accounts, or a "resend my ticket" endpoint are all natural next steps.
