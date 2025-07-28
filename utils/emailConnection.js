const nodemailer = require("nodemailer");
const CLIENT_URL = process.env.CLIENT_URL;

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: "starsuper.k1121@gmail.com",
    pass: "yvevslrotdxknvzb",
  },
});

module.exports = async function sendEmail(to, token) {
  console.log(token, "----------------fdfdfdfdfd-------------")
  const link = `${CLIENT_URL}api/auth/verify-email/${token}`;
  await transporter.sendMail({
    from: "starsuper.k1121@gmail.com",
    to,
    subject: "Verify your email",
    html: `<p>Click <a href="${link}">here</a> to verify your email</p>`
  });
};
// const sendEmail = async (email, token, url, emailType) => {
//   let mailOptions = {
//     from: "starsuper.k1121@gmail.com",
//     to: email,
//     subject: "Verify your email",
//     html: "",
//   };
//   if (emailType === "verification") {
//     mailOptions.subject = "Verify Your Email - Belly Basket";
//     mailOptions.html = `
//             <p>Dear user,</p>
//             <p>Thank you for choosing Belly Basket. To complete your registration and enhance the security of your account, please click the link below to verify your email address:</p>
//             <p><a href="${url}/api/v1/auth/verify/${token}">Verify Your Email Address</a></p>
//             <p>If you did not sign up for an account on Belly Basket, please ignore this email.</p>
//             <p>Best regards,</p>
//             <p>The Belly Basket Team</p>
//         `;
//   } else if (emailType === "resetPassword") {
//     mailOptions.subject = "Reset Your Password - Belly Basket";
//     mailOptions.html = `
//             <p>Dear user,</p>
//             <p>You have requested to reset your password. Please click the link below to set a new password:</p>
//             <p><a href="${url}/reset-password?token=${token}&email=${email}">Reset Your Password</a></p>
//             <p>If you did not request a password reset, please ignore this email or contact support if you have concerns about unauthorized activity on your account.</p>
//             <p>Best regards,</p>
//             <p>The Belly Basket Team</p>
//         `;
//   }

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`${emailType} email sent successfully to ${email}.`);
//   } catch (error) {
//     console.error(`Error sending ${emailType} email:`, error);
//   }
// };

// module.exports = sendEmail;
