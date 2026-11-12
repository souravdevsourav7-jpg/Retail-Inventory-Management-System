const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Retail Inventory - Email Verification OTP",
      text: `Your OTP is ${otp}. This OTP is valid for 5 minutes.`,
    });

    res.json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("OTP ERROR:", error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const savedOtp = otpStore.get(email);

  if (!savedOtp) {
    return res.status(400).json({
      message: "OTP not found. Please request a new OTP.",
    });
  }

  if (Date.now() > savedOtp.expiresAt) {
    otpStore.delete(email);

    return res.status(400).json({
      message: "OTP expired. Please request a new OTP.",
    });
  }

  if (savedOtp.otp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  otpStore.delete(email);

  res.json({
    message: "OTP verified successfully",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});