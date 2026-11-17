const { cookieName } = require('../config/env');
const { verifyAccessToken } = require('../utils/jwt');

/** Prevents authenticated users from returning to the login/register pages. */
function redirectAuthenticatedWeb(request, response, next) {
    response.set('Cache-Control', 'no-store');

    const token = request.cookies?.[cookieName];
    if (!token) {
        next();
        return;
    }

    try {
        verifyAccessToken(token);
        response.redirect('/groups');
    } catch {
        // Expired/invalid cookies should not block the public auth pages.
        response.clearCookie(cookieName, { path: '/' });
        next();
    }
}

module.exports = redirectAuthenticatedWeb;
