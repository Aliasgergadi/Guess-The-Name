require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Rate limiter for OTP route: max 3 requests per 10 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests
  message: { success: false, error: "Too many OTP requests. Try again after 10 minutes." }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// OTP email route (with rate limiter)
app.post('/send-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  // Generate 6-digit OTP
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
      <div style="font-family:Segoe UI, sans-serif; padding:20px; max-width:600px; margin:auto;">
        <h2 style="color:#0078d4;">Guess The Name - OTP Verification</h2>
        <p style="font-size:16px;">You're receiving this email because someone (hopefully you) is trying to verify their email address on the <strong>Guess The Name</strong> website.</p>
        <p style="font-size:16px;">Please use the code below to verify your email address and complete the submission process.</p>
        <p style="font-size:18px; margin:20px 0; font-weight:bold;">Your OTP: <span style="color:black;">${otp}</span></p>
        <p style="font-size:16px;">If you did not request this OTP or believe this was sent by mistake, you can safely ignore this email.</p>
        <p style="margin-top:40px;">Thanks,<br/>The Guess The Name Team</p>
        <hr style="margin-top:40px;" />
        <p style="font-size:12px; color:gray;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `Guess The Name <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Guess The Name',
      html: htmlTemplate,
    });

    // NOTE: Do NOT return OTP in response for security reasons
    res.json({ success: true });

  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ success: false, error: "Failed to send OTP. Please try again later." });
  }
});

// Socket.IO Chat functionality
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // Broadcast to all clients
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
