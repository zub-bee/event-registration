const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/checkin - { token }  (token = the string encoded in the QR code)
// Requires staff to be logged in.
router.post("/", requireAuth, (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing QR token" });
  }

  const registration = db.findByToken(token);

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
    });
  }

  const updated = db.markUsed(token);

  res.json({
    result: "valid",
    message: "Check-in successful",
    fullName: updated.fullName,
  });
});

module.exports = router;
