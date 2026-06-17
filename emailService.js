const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.mailtrap.io',
  port:   process.env.EMAIL_PORT  || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendAlertEmail(to, alertData) {
  const { ticker, condition, threshold, currentPrice } = alertData;
  const direction = condition === 'ABOVE' ? 'risen above' : 'fallen below';
  const emoji     = condition === 'ABOVE' ? '📈' : '📉';

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
      <h2 style="color: ${condition === 'ABOVE' ? '#1D9E75' : '#E24B4A'}">
        ${emoji} Price Alert: ${ticker}
      </h2>
      <p>Your alert has been triggered.</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px; color:#666">Ticker</td>
          <td style="padding:8px; font-weight:bold">${ticker}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px; color:#666">Condition</td>
          <td style="padding:8px">Price has ${direction} your threshold</td>
        </tr>
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:8px; color:#666">Your threshold</td>
          <td style="padding:8px">$${threshold}</td>
        </tr>
        <tr>
          <td style="padding:8px; color:#666">Current price</td>
          <td style="padding:8px; font-size:20px; font-weight:bold">$${currentPrice}</td>
        </tr>
      </table>
      <p style="color:#999; font-size:12px; margin-top:24px">
        Stock Portfolio Tracker — alert notifications
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || 'alerts@stocktracker.com',
      to,
      subject: `${emoji} ${ticker} price alert triggered — $${currentPrice}`,
      html,
    });
    logger.info(`Alert email sent to ${to} for ${ticker}`);
  } catch (err) {
    logger.error(`Failed to send alert email: ${err.message}`);
  }
}

module.exports = { sendAlertEmail };
