const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendRfpEmail(to, subject, text) {
  const info = await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    text
  });
  return info;
}

module.exports = { sendRfpEmail };
