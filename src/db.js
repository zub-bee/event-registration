const Database = require('better-sqlite3');
const db = new Database('../data/app.db'); // creates file if it doesn't exist

// Good defaults for a real app
db.pragma('journal_mode = WAL');

function createRegTable() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('unused', 'used')) DEFAULT 'unused' NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    usedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  )
`);
}

function createStaffTable() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS staffUsers (
    username TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
  )
`)
}



// ---- Registrations ----

createRegTable()
createStaffTable()

function getAllRegistrations() {
  const getReg = db.prepare('SELECT fullName, email, status, createdAt, usedAt FROM registrations');

  return getReg.all();
}

function getCheckedInCount() {
  const getCount = db.prepare('SELECT COUNT(id) FROM registrations WHERE status = ?');

  return getCount.get("used")
}

function findByEmail(email) {
  const getUser = db.prepare('SELECT fullName FROM registrations WHERE email = ?');

  return getUser.get(email);
}

function findByToken(token) {
  const getUser = db.prepare("SELECT fullName, email, status, usedAt FROM registrations WHERE token = ?");

  return getUser.get(token)

}

function addRegistration(registration) {

  const newUser = db.prepare(`
    INSERT INTO registrations 
    (id, fullName, email, token, status, createdAt, usedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *`);

  const { id, fullName, email, token, status, createdAt, usedAt } = registration;

  return newUser.run(id, fullName, email, token, status, createdAt, usedAt);
}

function markUsed(token) {

  db.prepare('UPDATE registrations SET status = "used" WHERE token = ?').run(token);

  return db.prepare('SELECT * FROM registrations WHERE token = ?').get(token);

}

// ---- Staff users (for scanner/admin login) ----

function findStaffByUsername(username) {
  return db.prepare(`SELECT username, passwordHash FROM staffUsers WHERE username = ?`).get(username);
}

function addStaffUser(user) {
  const { username, passwordHash } = user;

  return db.prepare("INSERT INTO staffUsers (username, passwordHash) VALUES (?, ?)").run(username, passwordHash);
}

module.exports = {
  createStaffTable,
  createRegTable,
  getAllRegistrations,
  getCheckedInCount,
  findByEmail,
  findByToken,
  addRegistration,
  markUsed,
  findStaffByUsername,
  addStaffUser,
};
