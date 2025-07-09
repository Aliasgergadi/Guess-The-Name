require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// OTP in-memory store
const otpStore = new Map();

// CORS for Netlify frontend
app.use(cors({
  origin: ['https://guessthename.infinityfreeapp.com'], // Replace with your Netlify domain
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Rate limit OTP requests
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: "Too many OTP requests. Try again later." }
});

// Route: send OTP
app.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const htmlTemplate = `
      <h2>Guess The Name - OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
    `;

    await transporter.sendMail({
      from: `Guess The Name <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Guess The Name',
      html: htmlTemplate,
    });

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    res.json({ success: true });

  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ success: false, error: "Failed to send OTP." });
  }
});

// Route: verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ success: false, error: "No OTP found." });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, error: "OTP expired." });
  }
  if (record.otp !== otp) return res.status(400).json({ success: false, error: "Invalid OTP." });

  otpStore.delete(email);
  res.json({ success: true });
});

// Root test
app.get('/', (req, res) => {
  res.send("🎉 Backend is running.");
});

// Setup Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'https://strong-pixie-f97079.netlify.app' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('chat message', (msg) => io.emit('chat message', msg));
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
