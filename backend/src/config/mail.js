const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',  
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;

transporter.verify(function(error, success) {
  if (error) {
    console.error('Email setup error:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});
