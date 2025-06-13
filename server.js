const express = require('express')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/send-otp', async (req, res) => {
  const { email } = req.body
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '1815.aliasgergadi@saifiyah.com',
        pass: 'qbrk sjin rvou emen'
      }
    })

    await transporter.sendMail({
      from: 'Guess The Name 1815.aliasgergadi@saifiyah.com',
      to: email,
      subject: 'Your OTP',
      text: Your OTP is: ${otp}
    })

    res.json({ success: true, otp })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: "Email failed" })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})

