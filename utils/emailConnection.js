const nodemailer = require("nodemailer");

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  secure: true,
  secureConnection: false,
  tls: {
    ciphers: "SSLv3",
  },
  requireTLS: true,
  port: 465,
  debug: true,
  connectionTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const sendEmail = async (email, username, url, emailType) => {
  console.log(url);
  let mailOptions = {
    from: "testuser@e-siremart.com",
    to: email,
    subject: "",
    html: "",
  };
  if (emailType === "verification") {
    mailOptions.subject = "Verify Your Email - e-SireMart Team";
    mailOptions.html = `
            <p>Dear ${username},</p>
            <p>Thank you for choosing e-SireMart Team. To complete your registration and enhance the security of your account, please click the link below to verify your email address:</p>
            <p><a href="${url}">Verify Your Email Address</a></p>
            <p>If you did not sign up for an account on e-SireMart Team, please ignore this email.</p>
            <p>Best regards,</p>
            <p>The e-SireMart Team</p>
        `;
  } else if (emailType === "resetPassword") {
    mailOptions.subject = "Reset Your Password - e-SireMart Team";
    mailOptions.html = `
            <p>Dear ${username},</p>
            <p>You have requested to reset your password. Please click the link below to set a new password:</p>
            <p><a href="${url}/reset-password?token=${token}&email=${email}">Reset Your Password</a></p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns about unauthorized activity on your account.</p>
            <p>Best regards,</p>
            <p>The e-SireMart Team</p>
        `;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${emailType} email sent successfully to ${email}.`);
    return true;
  } catch (error) {
    console.error(`Error sending ${emailType} email:`, error);
    return false;
  }
};

module.exports = sendEmail;
