import nodemailer from "nodemailer";

import dotenv from "dotenv";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";

dotenv.config();

if (!process.env.RESEND_API) {
  console.log("Provide RESEND_API in side the .env file");
}

// const resend = new Resend(process.env.RESEND_API);

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
  connectionTimeout: 30000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (sendTo, name, otp, verifyType) => {
  console.log("sendTo: ", sendTo);
  let mailOptions = {
    from: "noreply@e-siremart.com",
    to: sendTo,
    subject: "Verify email from E-Sire Mart",
    html: verifyEmailTemplate(name, otp, verifyType),
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`email sent successfully to ${sendTo}.`);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default sendEmail;
