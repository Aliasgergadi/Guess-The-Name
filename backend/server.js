const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // To load .env variables

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Memory store for OTPs
const otpStore = new Map(); // email => { otp, expiresAt }

// ✅ CORS setup for InfinityFree frontend
app.use(cors({
  origin: ['https://guessthename.infinityfreeapp.com'],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// ✅ Rate limiting to prevent abuse (3 OTPs per 10 mins per IP)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { success: false, error: "Too many OTP requests. Try again in 10 minutes." }
});

// ✅ Send OTP via email
app.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlContent = `
      <div style="font-family:Arial,sans-serif; background:#f1f8ff; padding:20px; border-radius:10px;">
        <h2 style="color:#138ea6;">👶 Guess The Name - OTP Verification</h2>
        <p>Your OTP is:</p>
        <div style="font-size:36px; font-weight:bold; color:#ff7cd3; margin:20px 0;">${otp}</div>
        <p>This OTP is valid for <b>10 minutes</b>.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Guess The Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Guess The Name',
      html: htmlContent
    });

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return res.status(500).json({ success: false, error: "Failed to send OTP." });
  }
});

// ✅ Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ success: false, error: "No OTP found." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, error: "OTP expired." });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ success: false, error: "Invalid OTP." });
  }

  otpStore.delete(email);
  return res.json({ success: true });
});

// ✅ Handle form submission (You can later connect this to Google Sheets or database)
app.post('/submit-form', (req, res) => {
  const { name, email, guess } = req.body;

  if (!name || !email || !guess) {
    return res.status(400).json({ success: false, error: "Missing required fields." });
  }

  // Just log for now (or save to DB/Sheet)
  console.log('📝 Form Submitted:', { name, email, guess });

  // ✅ You can forward this to Google Sheets / database here
  return res.status(200).json({ success: true, message: "Form submitted." });
});

// ✅ Health check
app.get('/', (req, res) => {
  res.send("🎉 Guess The Name backend is live!");
});

// ✅ Socket.IO for live chat
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://guessthename.infinityfreeapp.com',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // Broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
