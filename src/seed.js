// Run with: npm run seed
// Creates (or resets) the staff login used for the scanner and admin pages.
// Reads STAFF_USERNAME / STAFF_PASSWORD from .env

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function seed() {
  const username = process.env.STAFF_USERNAME;
  const password = process.env.STAFF_PASSWORD;

  if (!username || !password) {
    console.error(
      "Set STAFF_USERNAME and STAFF_PASSWORD in your .env file first (see .env.example)."
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = db.findStaffByUsername(username);

  if (existing) {
    console.log(`Staff user "${username}" already exists — skipping.`);
    console.log("Delete data/app.db and re-run if you want to reset everything.");
    return;
  }

  db.addStaffUser({ username, passwordHash });
  console.log(`Staff user "${username}" created. You can now log in on /login.html`);
}

seed();
