const assert = require('node:assert/strict');
const test = require('node:test');

const { calendarQuerySchema, upcomingQuerySchema } = require('../src/schemas/session.schema');
const userRepository = require('../src/repositories/user.repository');
const sessionRepository = require('../src/repositories/session.repository');
const { createServer } = require('../src');
const { signAccessToken } = require('../src/utils/jwt');

const studentId = '65f000000000000000000001';
const groupId = '65f000000000000000000002';

const studentToken = signAccessToken({ _id: studentId, role: 'STUDENT', email: 'student@example.com' });
const teacherToken = signAccessToken({ _id: '65f000000000000000000003', role: 'TEACHER', email: 'teacher@example.com' });

async function get(path, token) {
    const server = createServer().listen(0, '127.0.0.1');
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const body = await response.json();
        return { status: response.status, body };
    } finally {
        server.close();
    }
}

test('calendarQuerySchema accepts YYYY-MM-DD dates and rejects other formats', () => {
    assert.equal(calendarQuerySchema.safeParse({ from: '2026-11-01', to: '2026-11-30' }).success, true);
    assert.equal(calendarQuerySchema.safeParse({}).success, true);
    assert.equal(calendarQuerySchema.safeParse({ from: '01/11/2026' }).success, false);
});

test('upcomingQuerySchema keeps limit between 1 and 50', () => {
    assert.equal(upcomingQuerySchema.parse({ limit: '10' }).limit, 10);
    assert.equal(upcomingQuerySchema.safeParse({ limit: '0' }).success, false);
    assert.equal(upcomingQuerySchema.safeParse({ limit: '51' }).success, false);
});

for (const path of ['/api/sessions/mine', '/api/sessions/mine/upcoming']) {
    test(`GET ${path} requires a token`, async () => {
        const { status } = await get(path);
        assert.equal(status, 401);
    });

    test(`GET ${path} is forbidden for teachers`, async () => {
        const { status } = await get(path, teacherToken);
        assert.equal(status, 403);
    });
}

test('a student without a group gets 400', async (t) => {
    t.mock.method(userRepository, 'findById', async () => ({ _id: studentId, groupId: null }));

    const { status, body } = await get('/api/sessions/mine', studentToken);
    assert.equal(status, 400);
    assert.match(body.error.message, /not assigned to a group/);
});

test('an invalid date range gets 400', async (t) => {
    t.mock.method(userRepository, 'findById', async () => ({ _id: studentId, groupId }));

    const { status } = await get('/api/sessions/mine?from=2026-11-30&to=2026-11-01', studentToken);
    assert.equal(status, 400);
});

test('a student only gets the sessions of their own group', async (t) => {
    t.mock.method(userRepository, 'findById', async () => ({ _id: studentId, groupId }));
    const findForGroup = t.mock.method(sessionRepository, 'findForGroup', async () => [
        {
            _id: 's1',
            title: 'Math',
            sessionDate: new Date('2026-11-10T00:00:00.000Z'),
            startMin: 540,
            endMin: 600,
            groupIds: [{ _id: groupId, name: 'Group 1' }],
        },
    ]);

    const { status, body } = await get('/api/sessions/mine?from=2026-11-01&to=2026-11-30', studentToken);

    assert.equal(status, 200);
    assert.equal(findForGroup.mock.calls[0].arguments[0], groupId);
    assert.deepEqual(body, [
        {
            id: 's1',
            title: 'Math',
            sessionDate: '2026-11-10T00:00:00.000Z',
            startMin: 540,
            endMin: 600,
            groups: ['Group 1'],
        },
    ]);
});

test('upcoming sessions use the group of the logged-in student', async (t) => {
    t.mock.method(userRepository, 'findById', async () => ({ _id: studentId, groupId }));
    const find = t.mock.method(sessionRepository, 'findUpcomingForGroup', async () => []);

    const { status, body } = await get('/api/sessions/mine/upcoming?limit=3', studentToken);

    assert.equal(status, 200);
    assert.deepEqual(body, []);
    assert.equal(find.mock.calls[0].arguments[0], groupId);
    assert.equal(find.mock.calls[0].arguments[1].limit, 3);
});
