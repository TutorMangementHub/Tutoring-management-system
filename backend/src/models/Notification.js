const { Schema, model } = require('mongoose');

const notificationSchema = new Schema(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'recipientId is required'],
        },
        sessionId: {
            // Nullable on purpose: notifications outlive deleted sessions.
            type: Schema.Types.ObjectId,
            ref: 'Session',
            default: null,
        },
        title: {
            type: String,
            required: [true, 'title is required'],
            trim: true,
            minlength: [1, 'title cannot be empty'],
        },
        content: {
            type: String,
            required: [true, 'content is required'],
            minlength: [1, 'content cannot be empty'],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = model('Notification', notificationSchema);
