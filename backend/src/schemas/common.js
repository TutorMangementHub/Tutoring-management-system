const { z } = require('zod');

const objectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId');

const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeValue = z.union([z.number().int(), z.string().regex(hhmm, 'Expected HH:MM')]);

const dayOfWeek = z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
]);

module.exports = {
    z,
    objectId,
    timeValue,
    dayOfWeek,
};
