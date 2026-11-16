const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/**
 * Same collection validators as `mongo-schema.js`, expressed as plain objects
 * so the Node runner can apply them without `mongosh`.
 */
module.exports = {
    grades: {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['level'],
                properties: {
                    level: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty string and is required',
                    },
                },
            },
        },
        indexes: [{ keys: { level: 1 }, options: { unique: true } }],
    },

    groups: {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['gradeId', 'number', 'name', 'isActive', 'studentCount', 'createdAt', 'updatedAt'],
                properties: {
                    gradeId: {
                        bsonType: 'objectId',
                        description: 'must be an ObjectId referencing grades._id and is required',
                    },
                    number: {
                        bsonType: ['int', 'double', 'long'],
                        minimum: 1,
                        description: 'must be a number >= 1 and is required',
                    },
                    name: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty string and is required',
                    },
                    isActive: {
                        bsonType: 'bool',
                        description: 'must be a boolean and is required',
                    },
                    studentCount: {
                        bsonType: ['int', 'double', 'long'],
                        minimum: 0,
                        description: 'must be a number >= 0 and is required',
                    },
                    createdAt: {
                        bsonType: 'date',
                        description: 'must be a date and is required',
                    },
                    updatedAt: {
                        bsonType: 'date',
                        description: 'must be a date and is required',
                    },
                },
            },
        },
        indexes: [
            { keys: { gradeId: 1, number: 1 }, options: { unique: true } },
            { keys: { name: 1 }, options: {} },
        ],
    },

    users: {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['role', 'fullName', 'email', 'passwordHash', 'isActive', 'createdAt', 'updatedAt'],
                properties: {
                    role: {
                        enum: ['TEACHER', 'STUDENT'],
                        description: 'must be TEACHER or STUDENT and is required',
                    },
                    fullName: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty string and is required',
                    },
                    email: {
                        bsonType: 'string',
                        pattern: '^.+@.+\\..+$',
                        description: 'must be a valid email address and is required',
                    },
                    passwordHash: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty hash string and is required',
                    },
                    isActive: {
                        bsonType: 'bool',
                        description: 'must be a boolean and is required',
                    },
                    groupId: {
                        bsonType: ['objectId', 'null'],
                        description: 'must be an ObjectId referencing groups._id, or null (students only)',
                    },
                    createdAt: {
                        bsonType: 'date',
                        description: 'must be a date and is required',
                    },
                    updatedAt: {
                        bsonType: 'date',
                        description: 'must be a date and is required',
                    },
                },
            },
        },
        indexes: [
            { keys: { email: 1 }, options: { unique: true } },
            { keys: { groupId: 1 }, options: {} },
            {
                keys: { role: 1 },
                options: {
                    unique: true,
                    partialFilterExpression: { role: 'TEACHER' },
                    name: 'users_single_teacher',
                },
            },
        ],
    },

    freeSlots: {
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['groupId', 'dayOfWeek', 'startMin', 'endMin'],
                        properties: {
                            groupId: {
                                bsonType: 'objectId',
                                description: 'must be an ObjectId referencing groups._id and is required',
                            },
                            dayOfWeek: {
                                enum: WEEKDAYS,
                                description: 'must be a weekday name and is required',
                            },
                            startMin: {
                                bsonType: ['int', 'double', 'long'],
                                minimum: 0,
                                maximum: 1439,
                                description: 'must be minutes from midnight in [0, 1439] and is required',
                            },
                            endMin: {
                                bsonType: ['int', 'double', 'long'],
                                minimum: 1,
                                maximum: 1440,
                                description: 'must be minutes from midnight in [1, 1440] and is required',
                            },
                        },
                    },
                },
                { $expr: { $lt: ['$startMin', '$endMin'] } },
            ],
        },
        indexes: [
            { keys: { groupId: 1, dayOfWeek: 1 }, options: {} },
            { keys: { groupId: 1, dayOfWeek: 1, startMin: 1, endMin: 1 }, options: { unique: true } },
        ],
    },

    sessions: {
        validator: {
            $and: [
                {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['title', 'groupIds', 'sessionDate', 'startMin', 'endMin', 'createdAt', 'updatedAt'],
                        properties: {
                            title: {
                                bsonType: 'string',
                                minLength: 1,
                                description: 'must be a non-empty string and is required',
                            },
                            groupIds: {
                                bsonType: 'array',
                                minItems: 1,
                                uniqueItems: true,
                                items: { bsonType: 'objectId' },
                                description: 'must be a non-empty array of unique group ObjectIds and is required',
                            },
                            sessionDate: {
                                bsonType: 'date',
                                description: 'must be a date normalized to midnight UTC and is required',
                            },
                            startMin: {
                                bsonType: ['int', 'double', 'long'],
                                minimum: 0,
                                maximum: 1439,
                                description: 'must be minutes from midnight in [0, 1439] and is required',
                            },
                            endMin: {
                                bsonType: ['int', 'double', 'long'],
                                minimum: 1,
                                maximum: 1440,
                                description: 'must be minutes from midnight in [1, 1440] and is required',
                            },
                            createdAt: {
                                bsonType: 'date',
                                description: 'must be a date and is required',
                            },
                            updatedAt: {
                                bsonType: 'date',
                                description: 'must be a date and is required',
                            },
                        },
                    },
                },
                { $expr: { $lt: ['$startMin', '$endMin'] } },
            ],
        },
        indexes: [
            { keys: { groupIds: 1, sessionDate: 1 }, options: {} },
            { keys: { sessionDate: 1, startMin: 1 }, options: {} },
        ],
    },

    notifications: {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['recipientId', 'title', 'content', 'isRead', 'createdAt'],
                properties: {
                    recipientId: {
                        bsonType: 'objectId',
                        description: 'must be an ObjectId referencing users._id and is required',
                    },
                    sessionId: {
                        bsonType: ['objectId', 'null'],
                        description: 'must be an ObjectId referencing sessions._id, or null',
                    },
                    title: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty string and is required',
                    },
                    content: {
                        bsonType: 'string',
                        minLength: 1,
                        description: 'must be a non-empty string and is required',
                    },
                    isRead: {
                        bsonType: 'bool',
                        description: 'must be a boolean and is required',
                    },
                    createdAt: {
                        bsonType: 'date',
                        description: 'must be a date and is required',
                    },
                },
            },
        },
        indexes: [
            { keys: { recipientId: 1, isRead: 1, createdAt: -1 }, options: {} },
        ],
    },
};
