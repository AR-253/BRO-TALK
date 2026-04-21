const Settings = require('../models/Settings');

const containsProfanity = async (text) => {
    if (!text) return false;

    try {
        let settings = await Settings.findOne();
        let badWords = [];

        if (settings && settings.badWords && settings.badWords.length > 0) {
            badWords = settings.badWords;
        } else {
            // Fallback default dictionary
            badWords = [
                'abuse', 'scam', 'spam', 'idiot', 'stupid', 'dumb',
                'hate', 'kill', 'murder', 'fuck', 'shit', 'bitch',
                'asshole', 'cunt', 'dick', 'pussy', 'whore'
            ];
        }

        const lowerText = text.toLowerCase();
        return badWords.some(word => lowerText.includes(word.toLowerCase()));
    } catch (error) {
        console.error("Error in profanity filter:", error);
        return false; // Fail open to not block normal usage if DB fails
    }
};

module.exports = containsProfanity;
