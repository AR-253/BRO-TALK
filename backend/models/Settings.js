const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
    badWords: {
        type: [String],
        default: [
            'abuse', 'scam', 'spam', 'idiot', 'stupid', 'dumb',
            'hate', 'kill', 'murder', 'fuck', 'shit', 'bitch',
            'asshole', 'cunt', 'dick', 'pussy', 'whore'
        ]
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
