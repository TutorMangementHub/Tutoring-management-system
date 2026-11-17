const assert = require('node:assert/strict');
const test = require('node:test');

const { createGroupSchema } = require('../src/schemas/group.schema');
const { createServer } = require('../src');
const { signAccessToken } = require('../src/utils/jwt');

const gradeId = '65f000000000000000000000';

test('createGroupSchema accepts a valid group payload and applies defaults', () => {
    const result = createGroupSchema.parse({
        gradeId,
        number: 2,
        name: '  Group 2  ',
    });

    assert.deepEqual(result, {
        gradeId,
        number: 2,
        name: 'Group 2',
        isActive: true,
    });
});

test('createGroupSchema rejects invalid group data', () => {
    assert.throws(
        () => createGroupSchema.parse({ gradeId: 'not-an-id', number: 0, name: ' ' }),
        /valid MongoDB ObjectId/,
    );
});

async function requestGroup(payload, token) {
    const server = createServer().listen(0, '127.0.0.1');
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}/api/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });
        await response.arrayBuffer();
        return response;
    } finally {
        server.close();
    }
}

async function requestGroupApi(path, { method = 'GET', token } = {}) {
    const server = createServer().listen(0, '127.0.0.1');
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const address = server.address();
        const response = await fetch(`http://127.0.0.1:${address.port}/api/groups${path}`, {
            method,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        await response.arrayBuffer();
        return response;
    } finally {
        server.close();
    }
}

const groupId = '65f000000000000000000002';
const studentId = '65f000000000000000000003';

test('creating a group requires authentication', async () => {
    const response = await requestGroup({ gradeId, number: 1, name: 'Group 1' });
    assert.equal(response.status, 401);
});

test('only teachers can create groups', async () => {
    const token = signAccessToken({ _id: '65f000000000000000000001', role: 'STUDENT', email: 'student@example.com' });
    const response = await requestGroup({ gradeId, number: 1, name: 'Group 1' }, token);
    assert.equal(response.status, 403);
});

test('viewing group students requires authentication', async () => {
    const response = await requestGroupApi(`/${groupId}/students`);
    assert.equal(response.status, 401);
});

test('only teachers can view group students', async () => {
    const token = signAccessToken({ _id: '65f000000000000000000001', role: 'STUDENT', email: 'student@example.com' });
    const response = await requestGroupApi(`/${groupId}/students`, { token });
    assert.equal(response.status, 403);
});

test('removing a group student requires authentication', async () => {
    const response = await requestGroupApi(`/${groupId}/students/${studentId}`, { method: 'DELETE' });
    assert.equal(response.status, 401);
});

test('only teachers can remove group students', async () => {
    const token = signAccessToken({ _id: '65f000000000000000000001', role: 'STUDENT', email: 'student@example.com' });
    const response = await requestGroupApi(`/${groupId}/students/${studentId}`, { method: 'DELETE', token });
    assert.equal(response.status, 403);
});
