const { cookieName } = require('../config/env');
const { verifyAccessToken } = require('../utils/jwt');

/** Web authentication accepts the httpOnly cookie and redirects to login. */
function authenticateWeb(request, response, next) {
    response.set('Cache-Control', 'no-store');
    const token = request.cookies?.[cookieName];

    if (!token) {
        response.redirect('/login');
        return;
    }

    try {
        const payload = verifyAccessToken(token);
        request.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
        };
        next();
    } catch {
        response.clearCookie(cookieName, { path: '/' });
        response.redirect('/login');
    }
}

module.exports = authenticateWeb;
