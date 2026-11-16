const { z, objectId } = require('./common');

const createGroupSchema = z.object({
    gradeId: objectId,
    number: z.number().int().min(1),
    name: z.string().trim().min(1).max(100),
    isActive: z.boolean().default(true),
});

module.exports = { createGroupSchema };
