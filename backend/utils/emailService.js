const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Email Mock] No API Key.OTP to ${options.email}: ${options.message} `);
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'BRO TALK <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            text: options.message,
        });

        if (error) {
            console.error("Resend API Error:", error);
            return;
        }

        console.log('Email sent successfully:', data.id);
    } catch (error) {
        console.error("Error sending email via Resend:", error);
        // For development, we might not want to crash if email fails
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Email could not be sent');
        } else {
            console.log("Dev Mode: Email simulation failed, check logs.");
        }
    }
};

module.exports = sendEmail;
