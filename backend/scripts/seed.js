#!/usr/bin/env node

const path = require('node:path');

try {
    process.loadEnvFile(path.resolve(__dirname, '../.env'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}

const db = require('../src/config/db');
const { Grade, Group, User } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

const DEFAULT_GRADES = ['1AM', '2AM', '3AM', '4AM', '1AS', '2AS', '3AS'];

async function seed() {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is required (set it in backend/.env)');
    }

    const grades = new Map();
    for (const level of DEFAULT_GRADES) {
        const grade = await Grade.findOneAndUpdate(
            { level },
            { $setOnInsert: { level } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        grades.set(level, grade);
    }

    const teacherEmail = process.env.TEACHER_EMAIL;
    const teacherPassword = process.env.TEACHER_PASSWORD;
    if (!teacherEmail || !teacherPassword) {
        throw new Error('TEACHER_EMAIL and TEACHER_PASSWORD are required to seed the teacher');
    }

    const existingTeacher = await User.findOne({ role: 'TEACHER' });
    if (!existingTeacher) {
        await User.create({
            role: 'TEACHER',
            fullName: process.env.TEACHER_NAME || 'Teacher',
            email: teacherEmail.trim().toLowerCase(),
            passwordHash: await hashPassword(teacherPassword),
            isActive: true,
            groupId: null,
        });
    }

    let groupsCreated = 0;
    for (const [level, grade] of grades) {
        for (const number of [1, 2]) {
            const result = await Group.updateOne(
                { gradeId: grade._id, number },
                {
                    $setOnInsert: {
                        gradeId: grade._id,
                        number,
                        name: `${level}-G${number}`,
                        isActive: true,
                        studentCount: 0,
                    },
                },
                { upsert: true },
            );
            groupsCreated += result.upsertedCount;
        }
    }

    console.log(`Seed complete: ${grades.size} grades, ${groupsCreated} new groups, teacher ready`);
}

db.connect()
    .then(seed)
    .then(() => db.disconnect())
    .catch(async (error) => {
        console.error(`Seed failed: ${error.message}`);
        await db.disconnect();
        process.exitCode = 1;
    });
