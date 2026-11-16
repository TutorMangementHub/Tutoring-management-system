const HttpError = require('../utils/http-error');
const { hashPassword, verifyPassword } = require('../utils/password');
const userRepository = require('../repositories/user.repository');

/** Creates a STUDENT account. TEACHER accounts are provisioned by an admin. */
async function register({ fullName, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        throw HttpError.conflict('An account with this email already exists');
    }

    const user = await userRepository.create({
        role: 'STUDENT',
        fullName,
        email,
        passwordHash: await hashPassword(password),
        isActive: true,
        groupId: null,
    });

    return user.toObject();
}

async function login({ email, password }) {
    const user = await userRepository.findByEmail(email, { includePassword: true });

    if (!user || user.isActive === false) {
        throw HttpError.unauthorized('Invalid email or password');
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
        throw HttpError.unauthorized('Invalid email or password');
    }

    return user;
}

async function getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw HttpError.notFound('User not found');
    }
    return user;
}

module.exports = {
    register,
    login,
    getProfile,
};
