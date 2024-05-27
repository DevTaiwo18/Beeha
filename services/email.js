const nodemailer = require("nodemailer");

const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: EMAIL_USERNAME,
            pass: EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: "BeehaLagos@gmail.com",
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html 
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
