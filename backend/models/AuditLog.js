const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        enum: [
            'warn', 'suspend', 'unsuspend', 'ban', 'unban', 'role_change',
            'delete_post', 'hide_post', 'unhide_post',
            'delete_post_via_report', 'delete_comment_via_report', 'soft_delete_user_via_report',
            'create_admin', 'update_admin_permissions', 'delete_admin'
        ],
        required: true
    },
    reason: {
        type: String,
        default: 'No reason provided'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetType'
    },
    targetType: {
        type: String,
        enum: ['Post', 'Comment', 'User']
    },
    details: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
