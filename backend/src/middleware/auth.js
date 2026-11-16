const HttpError = require('../utils/http-error');

/** Allows the request only for the given roles. Run after authentication. */
function authorize(...roles) {
    return function roleGuard(request, _response, next) {
        if (!request.user) {
            next(HttpError.unauthorized());
            return;
        }
        if (roles.length > 0 && !roles.includes(request.user.role)) {
            next(HttpError.forbidden());
            return;
        }
        next();
    };
}

module.exports = {
    authorize,
};
