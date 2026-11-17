const assert = require('node:assert/strict');
const test = require('node:test');

const {
    createFreeSlotSchema,
    toMinutes,
    formatMinutes,
} = require('../src/schemas/freeSlot.schema');
const { cookieName } = require('../src/config/env');
const { createServer } = require('../src');
const { signAccessToken } = require('../src/utils/jwt');

const groupId = '65f000000000000000000000';
const slotId = '65f000000000000000000001';

test('createFreeSlotSchema accepts a valid slot on a weekday', () => {
    const result = createFreeSlotSchema.parse({
        dayOfWeek: 'MONDAY',
        start: '08:00',
        end: '09:00',
    });

    assert.deepEqual(result, {
        dayOfWeek: 'MONDAY',
        start: '08:00',
        end: '09:00',
    });
    assert.equal(toMinutes(result.start), 480);
    assert.equal(toMinutes(result.end), 540);
    assert.equal(formatMinutes(540), '09:00');
});

test('createFreeSlotSchema rejects Sunday', () => {
    const result = createFreeSlotSchema.safeParse({
        dayOfWeek: 'SUNDAY',
        start: '08:00',
        end: '09:00',
    });

    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /Monday and Saturday/);
});

test('createFreeSlotSchema rejects an end time that is not after the start', () => {
    const equal = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '09:00',
        end: '09:00',
    });
    const reversed = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '10:00',
        end: '09:00',
    });

    assert.equal(equal.success, false);
    assert.match(equal.error.issues[0].message, /after the start time/);
    assert.equal(reversed.success, false);
});

test('createFreeSlotSchema keeps slots between 08:00 and 17:00', () => {
    const boundary = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '08:00',
        end: '17:00',
    });
    const tooEarly = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '07:00',
        end: '08:00',
    });
    const tooLate = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '16:00',
        end: '17:30',
    });

    assert.equal(boundary.success, true);
    assert.equal(tooEarly.success, false);
    assert.equal(tooLate.success, false);
    assert.match(tooEarly.error.issues[0].message, /between 08:00 and 17:00/);
    assert.match(tooLate.error.issues[0].message, /between 08:00 and 17:00/);
});

test('createFreeSlotSchema rejects a malformed time', () => {
    const result = createFreeSlotSchema.safeParse({
        dayOfWeek: 'MONDAY',
        start: '8:00',
        end: '25:00',
    });

    assert.equal(result.success, false);
});

async function requestPath(path, { method = 'GET', token } = {}) {
    const server = createServer().listen(0, '127.0.0.1');
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
            method,
            redirect: 'manual',
            headers: token ? { Cookie: `${cookieName}=${token}` } : {},
        });
        await response.arrayBuffer();
        return response;
    } finally {
        server.close();
    }
}

const routes = [
    ['GET', `/groups/${groupId}/slots`],
    ['POST', `/groups/${groupId}/slots`],
    ['POST', `/groups/${groupId}/slots/${slotId}/delete`],
];

for (const [method, path] of routes) {
    test(`${method} ${path} redirects anonymous visitors to login`, async () => {
        const response = await requestPath(path, { method });

        assert.equal(response.status, 302);
        assert.equal(response.headers.get('location'), '/login');
    });

    test(`${method} ${path} forbids students`, async () => {
        const token = signAccessToken({
            _id: '65f000000000000000000002',
            role: 'STUDENT',
            email: 'student@example.com',
        });
        const response = await requestPath(path, { method, token });

        assert.equal(response.status, 403);
    });
}
