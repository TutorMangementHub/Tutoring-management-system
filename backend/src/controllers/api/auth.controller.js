const authService = require('../../services/auth.service');
const { signAccessToken } = require('../../utils/jwt');

function presentUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

async function register(request, response) {
    const user = await authService.register(request.validated.body);
    response.status(201).json({
        token: signAccessToken(user),
        user: presentUser(user),
    });
}

async function login(request, response) {
    const user = await authService.login(request.validated.body);
    response.json({
        token: signAccessToken(user),
        user: presentUser(user),
    });
}

async function me(request, response) {
    const user = await authService.getProfile(request.user.id);
    response.json({ user: presentUser(user) });
}

function logout(_request, response) {
    response.status(204).end();
}

module.exports = {
    register,
    login,
    me,
    logout,
};
