const { Schema, model } = require('mongoose');

const groupSchema = new Schema(
    {
        gradeId: {
            type: Schema.Types.ObjectId,
            ref: 'Grade',
            required: [true, 'gradeId is required'],
        },
        number: {
            type: Number,
            required: [true, 'number is required'],
            min: [1, 'number must be at least 1'],
            validate: {
                validator: Number.isInteger,
                message: 'number must be an integer',
            },
        },
        name: {
            type: String,
            required: [true, 'name is required'],
            trim: true,
            minlength: [1, 'name cannot be empty'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        studentCount: {
            type: Number,
            default: 0,
            min: [0, 'studentCount cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'studentCount must be an integer',
            },
        },
    },
    { timestamps: true },
);

// One group per (grade, number).
groupSchema.index({ gradeId: 1, number: 1 }, { unique: true });
groupSchema.index({ name: 1 });

module.exports = model('Group', groupSchema);
