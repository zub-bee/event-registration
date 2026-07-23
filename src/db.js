const { createClient } = require("@libsql/client");
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createRegTable() {
  await db.execute(`
  CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('unused', 'used')) DEFAULT 'unused' NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    usedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
}

async function createStaffTable() {
  await db.execute(`
  CREATE TABLE IF NOT EXISTS staffUsers (
    username TEXT NOT NULL,
    passwordHash TEXT NOT NULL
  )
`);
}

// ---- Registrations ----

async function init() {
  await createRegTable();
  await createStaffTable();
}
init();

async function getAllRegistrations() {
  const result = await db.execute(
    "SELECT fullName, email, status, createdAt, usedAt FROM registrations",
  );

  return result.rows;
}

async function getCheckedInCount() {
  const result = await db.execute({
    sql: "SELECT COUNT(id) FROM registrations WHERE status = ?",
    args: ["used"],
  });

  return result.rows[0];
}

async function findByEmail(email) {
  const result = await db.execute({
    sql: "SELECT fullName FROM registrations WHERE email = ?",
    args: [email],
  });

  return result.rows[0];
}

async function findByToken(token) {
  const result = await db.execute({
    sql: "SELECT fullName, email, status, usedAt FROM registrations WHERE token = ?",
    args: [token],
  });

  return result.rows[0];
}

async function addRegistration(registration) {
  const { id, fullName, email, token, status, createdAt, usedAt } =
    registration;

  const result = await db.execute({
    sql: `INSERT INTO registrations 
    (id, fullName, email, token, status, createdAt, usedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
    args: [id, fullName, email, token, status, createdAt, usedAt],
  });

  return result.rows[0];
}

async function markUsed(token) {
  await db.execute({
    sql: 'UPDATE registrations SET status = "used" WHERE token = ?',
    args: [token],
  });

  const result = await db.execute({
    sql: "SELECT * FROM registrations WHERE token = ?",
    args: [token],
  });

  return result.rows[0];
}

// ---- Staff users (for scanner/admin login) ----

async function findStaffByUsername(username) {
  const result = await db.execute({
    sql: "SELECT username, passwordHash FROM staffUsers WHERE username = ?",
    args: [username],
  });

  return result.rows[0];
}

async function addStaffUser(user) {
  const { username, passwordHash } = user;

  return db.execute({
    sql: "INSERT INTO staffUsers (username, passwordHash) VALUES (?, ?)",
    args: [username, passwordHash],
  });
}

module.exports = {
  init,
  getAllRegistrations,
  getCheckedInCount,
  findByEmail,
  findByToken,
  addRegistration,
  markUsed,
  findStaffByUsername,
  addStaffUser,
};
