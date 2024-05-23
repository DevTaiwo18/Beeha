const { createToken } = require("../services/token");
const sendEmail = require("../services/email");
const { encryptString } = require("../services/encryption");

const createVerificationTokenAndSendToEmail = async (req, user) => {
  const verificationToken = createToken();
  const verificationUrl = `https://beeha.onrender.com/api/v1/auth/verify/${user.email}/${verificationToken}`;

  const htmlContent = ` 
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border: 1px solid #dddddd;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                background-color: #6E260E;
                color: #ffffff;
                padding: 10px;
                text-align: center;
                font-size: 24px;
            }
            .content {
                padding: 20px;
                text-align: center;
                line-height: 1.5;
            }
            .footer {
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #888888;
            }
            a.verify-button {
                display: inline-block;
                padding: 10px 20px;
                margin: 20px 0;
                color: #ffffff;
                background-color: #6E260E;
                border-radius: 5px;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                Welcome to Beeha!
            </div>
            <div class="content">
                <p>Explore Beeha e-commerce website where you can find your desired designs. Something very special awaits!</p>
                <p>Verify your email to enjoy all our services:</p>
                <a href="${verificationUrl}" class="verify-button">Verify Your Email</a>
            </div>
            <div class="footer">
                Thank you for joining us at Beeha, where your desires become designs!
            </div>
        </div>
    </body>
    </html>
  `;

  const emailOptions = {
    email: user.email,
    subject: "Email Verification",
    text: `Please click on the following link to verify your email address: ${verificationUrl}`,    
    html: htmlContent  
  };

  await sendEmail(emailOptions);

  const hashedVerificationToken = await encryptString(verificationToken, 10);
  return hashedVerificationToken;
};

module.exports = { createVerificationTokenAndSendToEmail };
