const assert = require('node:assert/strict');
const test = require('node:test');

const { hashPassword, verifyPassword } = require('../src/utils/password');
const { signAccessToken, verifyAccessToken } = require('../src/utils/jwt');

test('password hashing round-trips and rejects wrong passwords', async () => {
    const hash = await hashPassword('Secret123!');

    assert.notEqual(hash, 'Secret123!');
    assert.equal(await verifyPassword('Secret123!', hash), true);
    assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('hashPassword rejects short passwords', async () => {
    await assert.rejects(hashPassword('short'), /at least 8 characters/);
});

test('JWT access tokens carry the user identity', () => {
    const token = signAccessToken({
        _id: '65f000000000000000000000',
        role: 'TEACHER',
        email: 'teacher@example.com',
    });

    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, '65f000000000000000000000');
    assert.equal(payload.role, 'TEACHER');
    assert.equal(payload.email, 'teacher@example.com');
});
