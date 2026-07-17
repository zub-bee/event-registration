const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { generateQRCodeBuffer } = require("../services/qrcode");
const { sendTicketEmail } = require("../services/email");

const router = express.Router();

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
