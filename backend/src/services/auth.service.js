const HttpError = require('../utils/http-error');
const { hashPassword, verifyPassword } = require('../utils/password');
const userRepository = require('../repositories/user.repository');
const groupRepository = require('../repositories/group.repository');
const groupService = require('./group.service');

/** Creates a STUDENT account. TEACHER accounts are provisioned by an admin. */
async function register({ fullName, email, password, gradeId, groupId }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
        throw HttpError.conflict('An account with this email already exists');
    }

    await groupService.assertAssignable(groupId, gradeId);

    const user = await userRepository.create({
        role: 'STUDENT',
        fullName,
        email,
        passwordHash: await hashPassword(password),
        isActive: true,
        groupId,
    });

    await groupRepository.incrementStudentCount(groupId, 1);
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

async function getTeacherSummary(userId) {
    const user = await getProfile(userId);
    return {
        name: user.fullName || 'Teacher',
        email: user.email || '',
    };
}

module.exports = {
    register,
    login,
    getProfile,
    getTeacherSummary,
};
