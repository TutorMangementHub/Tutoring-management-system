const { z } = require('zod');

const DAYS = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
];

const dayOfWeek = z.enum(DAYS, {
    message: 'Choose a day between Monday and Saturday',
});

const timeValue = z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use a valid time in HH:MM format');

const MIN_SLOT_MINUTES = 8 * 60;
const MAX_SLOT_MINUTES = 17 * 60;

/** Converts an HH:MM string into minutes from midnight. */
function toMinutes(value) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
}

/** Formats minutes from midnight as HH:MM. */
function formatMinutes(minutes) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mins = String(minutes % 60).padStart(2, '0');
    return `${hours}:${mins}`;
}

const createFreeSlotSchema = z
    .object({
        dayOfWeek,
        start: timeValue,
        end: timeValue,
    })
    .refine((value) => toMinutes(value.start) < toMinutes(value.end), {
        message: 'The end time must be after the start time',
        path: ['end'],
    })
    .refine(
        (value) => toMinutes(value.start) >= MIN_SLOT_MINUTES
            && toMinutes(value.end) <= MAX_SLOT_MINUTES,
        {
            message: 'Free time must be between 08:00 and 17:00',
            path: ['start'],
        },
    );

module.exports = {
    DAYS,
    dayOfWeek,
    timeValue,
    createFreeSlotSchema,
    toMinutes,
    formatMinutes,
};
