const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
    if (typeof plainPassword !== 'string' || plainPassword.length < 8) {
        throw new Error('Password must be a string of at least 8 characters');
    }
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, passwordHash) {
    if (!plainPassword || !passwordHash) {
        return false;
    }
    return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = {
    hashPassword,
    verifyPassword,
};
