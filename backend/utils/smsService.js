const sendSMS = async (to, message) => {
    // In production, you would use Twilio, Vonage, etc.
    console.log(`\n--- [SMS MOCK] ---`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`------------------\n`);

    // Simulate async operation
    return Promise.resolve(true);
};

module.exports = sendSMS;
