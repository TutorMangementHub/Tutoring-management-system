// ============================================================
// MongoDB schema (mongosh)
// Run:  mongosh "<MONGODB_URI>" mongo-schema.js
//
// Each collection is created with a native $jsonSchema validator plus
// validationLevel/validationAction, then its indexes are created.
//
// Run this on a fresh database. If the collections already exist, either
// drop them first (`db.<name>.drop()`) or use `npm run db:schema`, which
// applies the same validators with `collMod`.
// ============================================================

const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

// ---------------- grades ----------------
db.createCollection("grades", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["level"],
      properties: {
        level: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty string and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.grades.createIndex({ level: 1 }, { unique: true });

// ---------------- groups ----------------
db.createCollection("groups", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["gradeId", "number", "name", "isActive", "studentCount", "createdAt", "updatedAt"],
      properties: {
        gradeId: {
          bsonType: "objectId",
          description: "must be an ObjectId referencing grades._id and is required"
        },
        number: {
          bsonType: ["int", "double", "long"],
          minimum: 1,
          description: "must be a number >= 1 and is required"
        },
        name: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty string and is required"
        },
        isActive: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        },
        studentCount: {
          bsonType: ["int", "double", "long"],
          minimum: 0,
          description: "must be a number >= 0 and is required"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date and is required"
        },
        updatedAt: {
          bsonType: "date",
          description: "must be a date and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.groups.createIndex({ gradeId: 1, number: 1 }, { unique: true });
db.groups.createIndex({ name: 1 });

// ---------------- users ----------------
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["role", "fullName", "email", "passwordHash", "isActive", "createdAt", "updatedAt"],
      properties: {
        role: {
          enum: ["TEACHER", "STUDENT"],
          description: "must be TEACHER or STUDENT and is required"
        },
        fullName: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
          description: "must be a valid email address and is required"
        },
        passwordHash: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty hash string and is required"
        },
        isActive: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        },
        groupId: {
          bsonType: ["objectId", "null"],
          description: "must be an ObjectId referencing groups._id, or null (students only)"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date and is required"
        },
        updatedAt: {
          bsonType: "date",
          description: "must be a date and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ groupId: 1 });
db.users.createIndex({ role: 1 }, { unique: true, partialFilterExpression: { role: "TEACHER" } });

// ---------------- freeSlots ----------------
db.createCollection("freeSlots", {
  validator: {
    $and: [
      {
        $jsonSchema: {
          bsonType: "object",
          required: ["groupId", "dayOfWeek", "startMin", "endMin"],
          properties: {
            groupId: {
              bsonType: "objectId",
              description: "must be an ObjectId referencing groups._id and is required"
            },
            dayOfWeek: {
              enum: WEEKDAYS,
              description: "must be a weekday name and is required"
            },
            startMin: {
              bsonType: ["int", "double", "long"],
              minimum: 0,
              maximum: 1439,
              description: "must be minutes from midnight in [0, 1439] and is required"
            },
            endMin: {
              bsonType: ["int", "double", "long"],
              minimum: 1,
              maximum: 1440,
              description: "must be minutes from midnight in [1, 1440] and is required"
            }
          }
        }
      },
      // startMin < endMin, enforced by MongoDB itself
      { $expr: { $lt: ["$startMin", "$endMin"] } }
    ]
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.freeSlots.createIndex({ groupId: 1, dayOfWeek: 1 });
db.freeSlots.createIndex({ groupId: 1, dayOfWeek: 1, startMin: 1, endMin: 1 }, { unique: true });

// ---------------- sessions ----------------
db.createCollection("sessions", {
  validator: {
    $and: [
      {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "groupIds", "sessionDate", "startMin", "endMin", "createdAt", "updatedAt"],
          properties: {
            title: {
              bsonType: "string",
              minLength: 1,
              description: "must be a non-empty string and is required"
            },
            groupIds: {
              bsonType: "array",
              minItems: 1,
              uniqueItems: true,
              items: { bsonType: "objectId" },
              description: "must be a non-empty array of unique group ObjectIds and is required"
            },
            sessionDate: {
              bsonType: "date",
              description: "must be a date normalized to midnight UTC and is required"
            },
            startMin: {
              bsonType: ["int", "double", "long"],
              minimum: 0,
              maximum: 1439,
              description: "must be minutes from midnight in [0, 1439] and is required"
            },
            endMin: {
              bsonType: ["int", "double", "long"],
              minimum: 1,
              maximum: 1440,
              description: "must be minutes from midnight in [1, 1440] and is required"
            },
            createdAt: {
              bsonType: "date",
              description: "must be a date and is required"
            },
            updatedAt: {
              bsonType: "date",
              description: "must be a date and is required"
            }
          }
        }
      },
      // startMin < endMin, enforced by MongoDB itself
      { $expr: { $lt: ["$startMin", "$endMin"] } }
    ]
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.sessions.createIndex({ groupIds: 1, sessionDate: 1 });
db.sessions.createIndex({ sessionDate: 1, startMin: 1 });

// ---------------- notifications ----------------
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["recipientId", "title", "content", "isRead", "createdAt"],
      properties: {
        recipientId: {
          bsonType: "objectId",
          description: "must be an ObjectId referencing users._id and is required"
        },
        sessionId: {
          bsonType: ["objectId", "null"],
          description: "must be an ObjectId referencing sessions._id, or null"
        },
        title: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty string and is required"
        },
        content: {
          bsonType: "string",
          minLength: 1,
          description: "must be a non-empty string and is required"
        },
        isRead: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});
db.notifications.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 });

print("mongo-schema.js applied successfully");
