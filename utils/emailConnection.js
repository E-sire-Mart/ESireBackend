// const nodemailer = require("nodemailer");
// const CLIENT_URL = process.env.CLIENT_URL;


// // Create a Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // true for port 465, false for 587
//   auth: {
//     user: "starsuper.k1121@gmail.com",
//     pass: "yvevslrotdxknvzb",
//   },
// });

// module.exports = async function sendEmail(to, token) {
//   console.log(token, "----------------fdfdfdfdfd-------------")
//   const link = `${CLIENT_URL}api/auth/verify-email/${token}`;
//   await transporter.sendMail({
//     from: "starsuper.k1121@gmail.com",
//     to,
//     subject: "Verify your email",
//     html: `<p>Click <a href="${link}">here</a> to verify your email</p>`
//   });
// };
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


const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const SERVER_URL = process.env.SERVER_URL;
// console.log("-dsdsd--------", SERVER_URL)
const sendEmail = async (email, token) => {
  const verificationUrl = `${SERVER_URL}api/v1/auth/verify/${token}`;
  console.log(verificationUrl)
  console.log("📨 Sending to:", email);
  console.log("🔗 Link:", verificationUrl);

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "lucky.super.star0805@gmail.com",
      subject: "Verify your email",
      html: `
        <!DOCTYPE html>
     <html>
       <head>
         <meta charset="UTF-8" />
         <title>Verify Your Email</title>
       </head>
       <body style="background-color:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
         <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.1);">
           <!-- Header -->
           <tr>
             <td style="background-color:#0d6efd;padding:20px;text-align:center;border-top-left-radius:12px;border-top-right-radius:12px;">
               <img src="https://via.placeholder.com/80x80.png?text=Logo" alt="Logo" style="border-radius:50%;"/>
               <h1 style="color:#ffffff;margin:10px 0 0;">E-SireMart</h1>
             </td>
           </tr>
          
           <!-- Body -->
           <tr>
             <td style="padding:30px;text-align:center;">
               <h2 style="color:#333333;">Confirm your email address</h2>
               <p style="color:#555555;font-size:16px;">
                 Thanks for signing up with <strong>E-SireMart</strong>!<br/>
                 Please confirm your email by clicking the button below.
               </p>
               <a href="${verificationUrl}" style="display:inline-block;margin:30px 0;padding:15px 30px;background-color:#0d6efd;color:#ffffff;text-decoration:none;font-size:16px;border-radius:8px;">
                 Verify Email
               </a>
               <p style="color:#999999;font-size:12px;">If you didn't create this account, you can safely ignore this email.</p>
             </td>
           </tr>
          
           <!-- Footer -->
           <tr>
             <td style="background-color:#f8f9fa;padding:20px;text-align:center;border-bottom-left-radius:12px;border-bottom-right-radius:12px;">
               <p style="color:#888888;font-size:13px;margin:0;">
                 Contact us at <a href="mailto:support@E-SireMart.com" style="color:#0d6efd;">support@E-SireMart.com</a><br/>
                 E-SireMart, 1234 Web Street, Amsterdam, NL
               </p>
             </td>
           </tr>
         </table>
       </body>
     </html>
      `,
      text: `Please click this link to verify your email: ${verificationUrl}`,
      reply_to: "noreply@resend.dev",
    });
    console.log("📬 Resend response:", response);
  } catch (err) {
    console.error("❌ Send failed:", err);
  }
};



module.exports = sendEmail;
