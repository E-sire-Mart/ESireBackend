const express = require("express");
const { PhoneNumberUtil } = require("google-libphonenumber");

const phoneUtil = PhoneNumberUtil.getInstance();

let pendingResgistrations = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const verifyPhone = async (username, phoneNumber) => {
  try {
      const sendData = {
          message: String,
          sessionId: String
      };
    const otp = generateOTP();
    const expireTime = Date.now() + 6 * 60 * 1000;
    const sessionId = Math.random().toString(36).substring(2, 15);

    pendingResgistrations[sessionId] = {
      userData: { username, phoneNumber },
      otp,
      expireTime,
    };

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const smsUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    await axios.post(
      smsUrl,
      newURLSearchParams({
        From: twilioFrom,
        To: phoneNumber,
        Body: `Hello, dear ${username}.
            Your verification code is: ${otp}`,
      }),
      {
        auth: { username: accountSid, password: authToken },
      }
      );
      sendData = {
          message: "success",
          sessionId: sessionId,
      }
      return sendData;
  } catch (error) {
      console.error("Signup error:", error.message);
      sendData = {
          message: error.message,
          sessionId: null
      };
      return sendData;
  }
};

module.exports = {
  verifyPhone,
};
