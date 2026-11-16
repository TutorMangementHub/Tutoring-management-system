const { Schema, model } = require('mongoose');

const WEEKDAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
];

const freeSlotSchema = new Schema(
    {
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'groupId is required'],
        },
        dayOfWeek: {
            type: String,
            enum: { values: WEEKDAYS, message: 'dayOfWeek is not a valid weekday' },
            required: [true, 'dayOfWeek is required'],
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
    // Must match mongo-schema.js, which validates the `freeSlots` collection.
    // Mongoose's default would be the lowercased `freeslots`.
    { versionKey: false, collection: 'freeSlots' },
);

// Mirrors the database validator: startMin must be strictly before endMin.
freeSlotSchema.pre('validate', function enforceTimeOrdering() {
    if (
        Number.isInteger(this.startMin)
        && Number.isInteger(this.endMin)
        && this.startMin >= this.endMin
    ) {
        this.invalidate('endMin', 'endMin must be greater than startMin');
    }
});

freeSlotSchema.index({ groupId: 1, dayOfWeek: 1 });
freeSlotSchema.index(
    { groupId: 1, dayOfWeek: 1, startMin: 1, endMin: 1 },
    { unique: true },
);

module.exports = model('FreeSlot', freeSlotSchema);
module.exports.WEEKDAYS = WEEKDAYS;
