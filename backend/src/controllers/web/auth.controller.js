const { cookieName, cookieSecure } = require('../../config/env');
const authService = require('../../services/auth.service');
const { loginSchema } = require('../../schemas/user.schema');
const { signAccessToken } = require('../../utils/jwt');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function renderAuthError(response, view, body, error) {
    response.status(error.status || 400).render(view, {
        title: view === 'auth/login' ? 'Login' : 'Register',
        values: { ...body, password: '' },
        error: error.message,
    });
}

function setWebCookie(response, user) {
    response.cookie(cookieName, signAccessToken(user), {
        httpOnly: true,
        sameSite: 'lax',
        secure: cookieSecure,
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
    });
}

function loginPage(_request, response) {
    response.render('auth/login', {
        title: 'Login',
        values: { email: '' },
        error: null,
    });
}

async function login(request, response) {
    const result = loginSchema.safeParse(request.body);
    if (!result.success) {
        renderAuthError(response, 'auth/login', request.body, {
            status: 400,
            message: result.error.issues[0]?.message || 'Validation failed',
        });
        return;
    }

    try {
        const user = await authService.login(result.data);

        // The server-rendered login is for the teacher panel only.
        if (user.role !== 'TEACHER') {
            renderAuthError(response, 'auth/login', request.body, {
                status: 403,
                message: 'This login is for teacher accounts only.',
            });
            return;
        }

        setWebCookie(response, user);
        response.redirect('/groups');
    } catch (error) {
        renderAuthError(response, 'auth/login', request.body, error);
    }
}

function logout(_request, response) {
    response.clearCookie(cookieName, { path: '/' });
    response.redirect('/login');
}

module.exports = {
    loginPage,
    login,
    logout,
};
