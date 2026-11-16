const HttpError = require('../utils/http-error');
const { verifyAccessToken } = require('../utils/jwt');

/** API authentication accepts Bearer tokens only. */
function authenticateApi(request, _response, next) {
    const header = request.get('authorization');

    if (!header || !header.startsWith('Bearer ')) {
        next(HttpError.unauthorized('Bearer token required'));
        return;
    }

    try {
        const payload = verifyAccessToken(header.slice('Bearer '.length));
        request.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
        };
        next();
    } catch {
        next(HttpError.unauthorized('Invalid or expired token'));
    }
}

module.exports = authenticateApi;
