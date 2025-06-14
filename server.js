require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)))

// Serve index.html at root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// OTP endpoint
app.post('/send-otp', async (req, res) => {
  const { email } = req.body
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: `Guess The Name ${process.env.EMAIL_USER}`,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    })

    res.json({ success: true, otp })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: "Email failed" })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
