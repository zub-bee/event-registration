const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { generateQRCodeBuffer } = require("../services/qrcode");
const { sendTicketEmail } = require("../services/email");

const router = express.Router();

const CAPACITY = Number(process.env.EVENT_CAPACITY) || 100;

// GET /api/status - lets the frontend know if registration is still open
router.get("/status", (req, res) => {
  const registered = db.getRegistrationCount();
  res.json({
    capacity: CAPACITY,
    registered,
    remaining: Math.max(CAPACITY - registered, 0),
    closed: registered >= CAPACITY,
  });
});

// POST /api/register - { fullName, email }
router.post("/register", async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName || !fullName.trim() || !email || !email.trim()) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    const emailTrimmed = email.trim();
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(emailTrimmed)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // Re-check capacity right before inserting to reduce (not eliminate)
    // race conditions if two people submit at almost the same moment.
    const currentCount = db.getRegistrationCount();
    if (currentCount >= CAPACITY) {
      return res.status(409).json({ error: "Registration is closed — all spots are full" });
    }

    if (db.findByEmail(emailTrimmed)) {
      return res.status(409).json({ error: "This email has already registered" });
    }

    const token = uuidv4();
    const registration = {
      id: uuidv4(),
      fullName: fullName.trim(),
      email: emailTrimmed,
      token,
      status: "unused", // becomes "used" once scanned at the event
      createdAt: new Date().toISOString(),
      usedAt: null,
    };

    db.addRegistration(registration);

    const qrCodeBuffer = await generateQRCodeBuffer(token);
    await sendTicketEmail({
      to: registration.email,
      fullName: registration.fullName,
      qrCodeBuffer,
    });

    res.status(201).json({
      message: "Registration successful! Check your email for your ticket.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
