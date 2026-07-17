const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const CAPACITY = Number(process.env.EVENT_CAPACITY) || 100;

// GET /api/admin/registrations - full list and summary counts
router.get("/registrations", requireAuth, (req, res) => {
  const registrations = db.getAllRegistrations();
  const usedCount = registrations.filter((r) => r.status === "used").length;

  res.json({
    capacity: CAPACITY,
    total: registrations.length,
    checkedIn: usedCount,
    registrations: registrations
      .map((r) => ({
        fullName: r.fullName,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
        usedAt: r.usedAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
});

module.exports = router;
