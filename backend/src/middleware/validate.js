const HttpError = require('../utils/http-error');

/**
 * Validates request data with a Zod schema and stores the parsed value in
 * `request.validated[source]` so controllers never touch raw input.
 */
function validate(schema, source = 'body') {
    return function validateRequest(request, _response, next) {
        const result = schema.safeParse(request[source]);

        if (!result.success) {
            const details = result.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }));
            next(HttpError.badRequest('Validation failed', details));
            return;
        }

        request.validated = { ...(request.validated || {}), [source]: result.data };
        next();
    };
}

module.exports = validate;
