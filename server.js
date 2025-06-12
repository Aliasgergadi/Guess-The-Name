const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const nodemailer = require('nodemailer')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/send-otp', async (req, res) => {
  const email = req.body.email
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '1815.aliasgergadi@saifiyah.com',
      pass: 'qbrk sjin rvou emen'
    }
  })

  const mailOptions = {
    from: '1815.aliasgergadi@saifiyah.com',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${otp}`
  }

  try {
    await transporter.sendMail(mailOptions)
    res.json({ success: true, otp })
  } catch {
    res.json({ success: false })
  }
})

app.listen(3000)
