const verifyEmailTemplate = (name, otp, verifyType) => {
  if (verifyType === "email") {
    return `
  <!DOCTYPE html>
    <html lang="en" >
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f6fa;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #f5f6fa;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        margin-bottom: 20px;
        display: flex;
        flex-direction:column;
        justify-content: center;
        align-center: center;
      }
      .header div {
      width: 100%;
      display: flex;
      justify-content: center;
      align-center:center;
      }
      .header img {
        max-width: 100%;

        border-radius: 10px;
      }
      .otp-section {
        text-align: center;
        margin: 20px 0;
        background-color: #e8e8e8;
        padding: 30px;
        border-radius: 10px;
      }
      .section-title1 {
        font-family: "Poppins ", sans-serif;
        font-size: 30px;
        color: #333;
        font-weight: 600;
        margin-bottom: 10px;
        line-height: 1.4;
      }
      .section-content {
        font-family: "Roboto", sans-serif;
        font-size: 18px;
        color: #333;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .section-content123 {
        font-family: "Roboto", sans-serif;
        font-size: 15px;
        color: #333;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .section-content125 {
        font-family: "Roboto", sans-serif;
        font-size: 13px;
        color: #9a9a9a;
        font-weight: 300;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .otp-section p {
        font-size: 18px;
        color: #333;
        margin: 0 0 10px;
      }
      .otp-code {
        font-size: 28px;
        color: #333;
        padding: 10px 20px;
        border-radius: 8px;
        display: inline-block;
      }
      .footer {
        background-color: #f3f2ef;
        padding: 20px;
        font-size: 14px;
        color: #666;
        text-align: center;
        border-top: 1px solid #e0e0e0;
      }
      .footer a {
        color: #1a73e8;
        text-decoration: none;
      }
      .action-button {
        display: inline-block;
        background-color: #2463eb;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 5px;
        font-weight: bold;
        margin-top: 20px;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 600px;
        margin: 20px auto 0;
        padding: 0 20px;
      }
      .header-container img {
        height: 40px;
      }
      .social-icons {
        display: flex;
        gap: qpx;
      }
      .social-icons a img {
        height: 20px;
        width: 20px;
      }
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          padding: 10px;
          border-radius: 0;
        }
        .otp-code {
          font-size: 24px;
        }
        table {
          width: 100% !important;
        }
        td {
          padding: 5px !important;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .header img {
          max-width: 150px;
          height: auto;
        }
        .social-icons a img {
          width: 20px;
          height: 20px;
        }
        table td img {
          height: 30px !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header" style="margin-bottom: 20px; width: 100%;">
        <img
          src="https://res.cloudinary.com/e-siremart/image/upload/v1742215222/siremartBLogo_m6viay.png"
          alt="E-sireMart logo"
          style="width:50px"
        />
      </div>
      <div>
      <img
      src="https://res.cloudinary.com/e-siremart/image/upload/v1742214507/background_sfg4kk.png"
      alt="E-siremart back"
      /></div>
      <p class="section-title1">Confirm your email address</p>

      <p class="section-content">Hello, dear ${name}. Welcome to E-sire Mart</p>
      <p class="section-content">
        Your confirmation code is below — enter it in your open browser window
        and well help you get signed in.
      </p>

      <div class="otp-section"><div class="otp-code">${otp}</div></div>
      <br />
      <p class="section-content123">
        If you didn't request this email, there's nothing to worry about - you
        can safely ignore it.
      </p>
      <table style="width: 100%; border-spacing: 0; margin-top: 20px">
        <tr>
          <td style="width: 50%; text-align: left; padding: 0 10px">
            <img
              src="./assets/logo.png"
              alt="E-siremart Logo"
              style="height: 40px; vertical-align: middle"
            />
          </td>
          <td style="width: 50%; text-align: right; padding: 0 10px">
            <a href="#"
              ><img
                src="https://storage.googleapis.com/twitter-new-2023-x-logo-white-background-vector_1017-45422.jpg"
                alt="Twitter"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/facebook-svgrepo-com.png"
                alt="Facebook"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/linkedin--com.png"
                alt="LinkedIn"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/youtube-168-svgrepo-com.png"
                alt="YouTube"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/instagram-167-svgrepo-com.png"
                alt="Instagram"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
          </td>
        </tr>
      </table>
      <br />
      <br />
      <tr>
        <td style="color: #666">
          <p class="section-content125">
            This email was intended for info@e-siremart.com.<br />Learn why we
            included this email.
          </p>
          <p>
            <a href="#" style="color: #1a73e8; text-decoration: none"
              >Unsubscribe</a
            >
            · <a href="#" style="color: #1a73e8; text-decoration: none">Help</a>
          </p>
          <p class="section-content125">
            &copy; 2025, E-sire Mart. All rights reserved.
          </p>
        </td>
      </tr>
    </div>
      </body>
</html>
`;
  } else {
    return `
  <!DOCTYPE html>
    <html lang="en" >
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f6fa;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #f5f6fa;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        margin-bottom: 20px;
      }
      .header img {
        max-width: 100%;
        border-radius: 10px;
      }
      .otp-section {
        text-align: center;
        margin: 20px 0;
        background-color: #e8e8e8;
        padding: 30px;
        border-radius: 10px;
      }
      .section-title1 {
        font-family: "Poppins ", sans-serif;
        font-size: 30px;
        color: #333;
        font-weight: 600;
        margin-bottom: 10px;
        line-height: 1.4;
      }
      .section-content {
        font-family: "Roboto", sans-serif;
        font-size: 18px;
        color: #333;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .section-content123 {
        font-family: "Roboto", sans-serif;
        font-size: 15px;
        color: #333;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .section-content125 {
        font-family: "Roboto", sans-serif;
        font-size: 13px;
        color: #9a9a9a;
        font-weight: 300;
        line-height: 1.6;
        letter-spacing: 0.3px;
        margin-bottom: 15px;
        hyphens: auto;
        word-break: break-word;
        overflow-wrap: break-word;
      }
      .otp-section p {
        font-size: 18px;
        color: #333;
        margin: 0 0 10px;
      }
      .otp-code {
        font-size: 28px;
        color: #333;
        padding: 10px 20px;
        border-radius: 8px;
        display: inline-block;
      }
      .footer {
        background-color: #f3f2ef;
        padding: 20px;
        font-size: 14px;
        color: #666;
        text-align: center;
        border-top: 1px solid #e0e0e0;
      }
      .footer a {
        color: #1a73e8;
        text-decoration: none;
      }
      .action-button {
        display: inline-block;
        background-color: #2463eb;
        color: #ffffff;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 5px;
        font-weight: bold;
        margin-top: 20px;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 600px;
        margin: 20px auto 0;
        padding: 0 20px;
      }
      .header-container img {
        height: 40px;
      }
      .social-icons {
        display: flex;
        gap: qpx;
      }
      .social-icons a img {
        height: 20px;
        width: 20px;
      }
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          padding: 10px;
          border-radius: 0;
        }
        .otp-code {
          font-size: 24px;
        }
        table {
          width: 100% !important;
        }
        td {
          padding: 5px !important;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .header img {
          max-width: 150px;
          height: auto;
        }
        .social-icons a img {
          width: 20px;
          height: 20px;
        }
        table td img {
          height: 30px !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header" style="margin-bottom: 20px; width: 100%;">
        <img
          src="https://res.cloudinary.com/e-siremart/image/upload/v1742214507/logo_qgblmr.png"
          alt="E-sireMart logo"
          style="max-width: 50px;width:50px"
        />
      </div>
      <div style="width: 100%" >
       <img
        src="https://res.cloudinary.com/e-siremart/image/upload/v1742214507/background_sfg4kk.png"
        alt="E-siremart back"
        />
      </div>
      <p class="section-title1">Confirm your email address</p>

      <p class="section-content">Hello, dear ${name}. Welcome to E-sire Mart</p>
      <p class="section-content">
        Your confirmation code is below — enter it in your open browser window
        and well help you get signed in.
      </p>

      <div class="otp-section"><div class="otp-code">${otp}</div></div>
      <br />
      <p class="section-content123">
        If you didn't request this email, there's nothing to worry about - you
        can safely ignore it.
      </p>
      <table style="width: 100%; border-spacing: 0; margin-top: 20px">
        <tr>
          <td style="width: 50%; text-align: left; padding: 0 10px">
            <img
              src=""
              alt="E-siremart Logo"
              style="height: 40px; vertical-align: middle"
            />
          </td>
          <td style="width: 50%; text-align: right; padding: 0 10px">
            <a href="#"
              ><img
                src="https://storage.googleapis.com/twitter-new-2023-x-logo-white-background-vector_1017-45422.jpg"
                alt="Twitter"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/facebook-svgrepo-com.png"
                alt="Facebook"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/linkedin--com.png"
                alt="LinkedIn"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/youtube-168-svgrepo-com.png"
                alt="YouTube"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
            <a href="#"
              ><img
                src="https://storage.googleapis.com/instagram-167-svgrepo-com.png"
                alt="Instagram"
                style="width: 25px; height: 25px; margin-left: 5px"
            /></a>
          </td>
        </tr>
      </table>
      <br />
      <br />
      <tr>
        <td style="color: #666">
          <p class="section-content125">
            This email was intended for info@e-siremart.com.<br />Learn why we
            included this email.
          </p>
          <p>
            <a href="#" style="color: #1a73e8; text-decoration: none"
              >Unsubscribe</a
            >
            · <a href="#" style="color: #1a73e8; text-decoration: none">Help</a>
          </p>
          <p class="section-content125">
            &copy; 2025, E-sire Mart. All rights reserved.
          </p>
        </td>
      </tr>
    </div>
      </body>
</html>
`;
  }
};

export default verifyEmailTemplate;
