const { z } = require('./common');

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format');

const calendarQuerySchema = z.object({
    from: dateOnly.optional(),
    to: dateOnly.optional(),
});

const upcomingQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

module.exports = { calendarQuerySchema, upcomingQuerySchema };
