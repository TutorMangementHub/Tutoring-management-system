const { Schema, model } = require('mongoose');

const gradeSchema = new Schema(
    {
        level: {
            type: String,
            required: [true, 'level is required'],
            trim: true,
            minlength: [1, 'level cannot be empty'],
        },
    },
    { versionKey: false },
);

gradeSchema.index({ level: 1 }, { unique: true });

module.exports = model('Grade', gradeSchema);
