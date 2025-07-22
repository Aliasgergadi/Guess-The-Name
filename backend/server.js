require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'https://guessthename.infinityfreeapp.com' }));

const otpStore = new Map();
const otpLimiter = rateLimit({
  windowMs: 10*60*1000, // 10min
  max: 3,
  message: { success: false, error: "Too many OTP requests." }
});

app.post('/send-otp', otpLimiter, async (req, res) => {
  const email = req.body.email?.trim();
  if (!email) return res.status(400).json({ success: false, error: "Email required" });
  const otp = (Math.floor(100000 + Math.random()*900000)).toString();
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP",
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background: #f9f9f9;">
    <h2 style="color: #333;">Guess The Name - OTP Verification</h2>
    <p style="font-size: 16px; color: #555;">Hello,</p>
    <p style="font-size: 16px; color: #555;">
      Your One-Time Password (OTP) for verifying your email is:
    </p>
    <div style="font-size: 28px; font-weight: bold; text-align: center; padding: 15px 0; color: #2c3e50;">
      ${otp}
    </div>
    <p style="font-size: 14px; color: #888;">
      This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
    </p>
    <hr style="margin: 20px 0;">
    <p style="font-size: 12px; color: #aaa;">
      If you did not request this, please ignore this email.
    </p>
    <p style="font-size: 12px; color: #aaa;">– Guess The Name Team</p>
  </div>
`

    });

    otpStore.set(email, { otp, expires: Date.now() + 600000 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Email failed" });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const rec = otpStore.get(email);
  if (!rec) return res.status(400).json({ success: false, error: "No OTP" });
  if (Date.now() > rec.expires) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, error: "OTP expired" });
  }
  if (rec.otp !== otp) {
    return res.status(400).json({ success: false, error: "Invalid OTP" });
  }
  otpStore.delete(email);
  res.json({ success: true });
});

app.post('/submit-form', (req, res) => {
  const { name, email, guess } = req.body;
  if (!name || !email || !guess) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }
  console.log("Received:", { name, email, guess });
  res.json({ success: true });
});

app.get('/', (req, res) => res.send("OK"));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'https://guessthename.infinityfreeapp.com' } });
io.on('connection', s => {
  s.on('chat message', msg => io.emit('chat message', msg));
});
server.listen(process.env.PORT || 3000, () => console.log("Server live"));
