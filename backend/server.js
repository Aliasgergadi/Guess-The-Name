const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const otpStore = new Map(); // Stores email->otp with expiry

// ✅ CORS setup for frontend on InfinityFree
app.use(cors({
  origin: ['https://guessthename.infinityfreeapp.com'],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// ✅ Rate limit OTP sending (3 per 10 min)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: "Too many OTP requests. Try again in 10 minutes." }
});

// ✅ SEND OTP endpoint
app.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const htmlTemplate = `
      <div style="font-family:Arial,sans-serif; background-color:#f9f9f9; padding:20px; border-radius:10px;">
        <h2 style="color:#138ea6;">👶 Guess The Name - OTP Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size:36px; font-weight:bold; color:#ff7cd3; margin:20px 0;">${otp}</div>
        <p style="font-size:14px; color:#666;">This OTP is valid for 10 minutes.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `Guess The Name <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Guess The Name',
      html: htmlTemplate
    });

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("OTP Send Error:", err);
    return res.status(500).json({ success: false, error: "Failed to send OTP." });
  }
});

// ✅ VERIFY OTP endpoint
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
    io.emit('chat message', msg); // Broadcast to all users
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
