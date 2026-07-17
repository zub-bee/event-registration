require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/auth");
const checkinRoutes = require("./routes/checkin");
const adminRoutes = require("./routes/admin");

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET is not set in your .env file. Copy .env.example to .env and fill it in."
  );
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api", registerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/admin", adminRoutes);

// Frontend (plain HTML/JS, no build step needed)
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
