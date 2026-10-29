const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API Key missing. Skipping email.');
    return;
  }
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM || 'noreply@rentrex.com',
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error.response?.body || error.message);
  }
};

const sendSMS = async ({ to, body }) => {
  if (!twilioClient) {
    console.warn('Twilio config missing. Skipping SMS.');
    return;
  }
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error('SMS sending failed:', error.message);
  }
};

module.exports = { sendEmail, sendSMS };
