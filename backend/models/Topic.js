const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a topic title'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
});

topicSchema.index({ subscribers: 1 });
topicSchema.index({ title: 1 });

module.exports = mongoose.model('Topic', topicSchema);
