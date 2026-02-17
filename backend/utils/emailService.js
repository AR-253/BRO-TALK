const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        // For development/testing without real creds, you might use Ethereal:
        // host: "smtp.ethereal.email",
        // port: 587,
        // secure: false, // true for 465, false for other ports
        // auth: {
        //   user: testAccount.user, 
        //   pass: testAccount.pass, 
        // },
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // You can send HTML email too
    };

    console.log(`[Email Mock] Sending email to ${options.email} with subject: ${options.subject}`);

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
        // For development, we might not want to crash if email fails
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Email could not be sent');
        } else {
            console.log("Dev Mode: Email simulated.");
        }
    }
};

module.exports = sendEmail;
