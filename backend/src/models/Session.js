const { Schema, model } = require('mongoose');

/** Drops the time component so a session is keyed by calendar day only. */
function toMidnightUTC(value) {
    if (value === null || value === undefined) {
        return value;
    }

    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) {
        // Let Mongoose report the CastError for the invalid date.
        return value;
    }

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const sessionSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'title is required'],
            trim: true,
            minlength: [1, 'title cannot be empty'],
        },
        groupIds: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
            required: [true, 'groupIds is required'],
            validate: [
                {
                    validator: (value) => Array.isArray(value) && value.length >= 1,
                    message: 'groupIds must contain at least one group',
                },
                {
                    validator: (value) => new Set(value.map(String)).size === value.length,
                    message: 'groupIds must not contain duplicates',
                },
            ],
        },
        sessionDate: {
            type: Date,
            required: [true, 'sessionDate is required'],
            set: toMidnightUTC,
        },
        startMin: {
            type: Number,
            required: [true, 'startMin is required'],
            min: [0, 'startMin must be >= 0'],
            max: [1439, 'startMin must be <= 1439'],
            validate: {
                validator: Number.isInteger,
                message: 'startMin must be an integer',
            },
        },
        endMin: {
            type: Number,
            required: [true, 'endMin is required'],
            min: [1, 'endMin must be >= 1'],
            max: [1440, 'endMin must be <= 1440'],
            validate: {
                validator: Number.isInteger,
                message: 'endMin must be an integer',
            },
        },
    },
    { timestamps: true },
);

// Mirrors the database validator: startMin must be strictly before endMin.
sessionSchema.pre('validate', function enforceTimeOrdering() {
    if (
        Number.isInteger(this.startMin)
        && Number.isInteger(this.endMin)
        && this.startMin >= this.endMin
    ) {
        this.invalidate('endMin', 'endMin must be greater than startMin');
    }
});

sessionSchema.index({ groupIds: 1, sessionDate: 1 });
sessionSchema.index({ sessionDate: 1, startMin: 1 });

module.exports = model('Session', sessionSchema);
module.exports.toMidnightUTC = toMidnightUTC;
