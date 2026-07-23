const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const CAPACITY = Number(process.env.EVENT_CAPACITY) || 100;

// GET /api/status - lets the admin know if checkin is still open
router.get("/status", (req, res) => {
  const registered = db.getCheckedInCount();
  res.json({
    capacity: CAPACITY,
    registered: registered,
    remaining: Math.max(CAPACITY - registered, 0),
    closed: registered >= CAPACITY,
  });
});

// POST /api/checkin - { token }  (token = the string encoded in the QR code)
// Requires staff to be logged in.
router.post("/", requireAuth, async (req, res) => {
  const { token, confirm = false } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing QR token" });
  }

  const currentCount = await db.getCheckedInCount();
  if (currentCount >= CAPACITY) {
    return res
      .status(409)
      .json({ error: "Checkin is closed, all spots are full" });
  }

  const registration = await db.findByToken(token);

  if (!registration) {
    return res.status(404).json({
      result: "invalid",
      message: "QR code not recognized",
    });
  }

  if (registration.status === "used") {
    return res.status(409).json({
      result: "already_used",
      message: `Already scanned at ${registration.usedAt}`,
      fullName: registration.fullName,
      email: registration.email,
      usedAt: registration.usedAt,
    });
  }

  if (!confirm) {
    return res.json({
      result: "valid",
      message: "Ticket is valid",
      fullName: registration.fullName,
      email: registration.email,
    });
  }

  const updated = await db.markUsed(token);

  return res.json({
    result: "checked_in",
    message: "Check-in successful",
    fullName: updated.fullName,
    email: updated.email,
    usedAt: updated.usedAt,
  });
});

module.exports = router;
