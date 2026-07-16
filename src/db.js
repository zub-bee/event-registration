// Very small file-based "database".
//
// For a 100-person event, a JSON file is more than enough and it means
// you don't need to install/configure a real database to get started.
// Everything is stored in data/db.json.
//
// When you outgrow this (bigger events, multiple servers), swap this
// file for a real DB (Postgres/Mongo) — the rest of the app only talks
// to the functions exported below, so nothing else needs to change.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { registrations: [], staffUsers: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function readDB() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---- Registrations ----

function getAllRegistrations() {
  return readDB().registrations;
}

function getRegistrationCount() {
  return readDB().registrations.length;
}

function findByEmail(email) {
  const db = readDB();
  return db.registrations.find(
    (r) => r.email.toLowerCase() === email.toLowerCase(),
  );
}

function findByToken(token) {
  const db = readDB();
  return db.registrations.find((r) => r.token === token);
}

function addRegistration(registration) {
  const db = readDB();
  db.registrations.push(registration);
  writeDB(db);
  return registration;
}

function markUsed(token) {
  const db = readDB();
  const reg = db.registrations.find((r) => r.token === token);
  if (!reg) return null;
  reg.status = "used";
  reg.usedAt = new Date().toISOString();
  writeDB(db);
  return reg;
}

// ---- Staff users (for scanner/admin login) ----

function findStaffByUsername(username) {
  const db = readDB();
  return db.staffUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
}

function addStaffUser(user) {
  const db = readDB();
  db.staffUsers.push(user);
  writeDB(db);
  return user;
}

module.exports = {
  getAllRegistrations,
  getRegistrationCount,
  findByEmail,
  findByToken,
  addRegistration,
  markUsed,
  findStaffByUsername,
  addStaffUser,
};
