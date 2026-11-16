/** Error carrying an HTTP status and a stable machine-readable code. */
class HttpError extends Error {
    constructor(status, message, code = undefined, details = undefined) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.details = details;
    }

    static badRequest(message, details) {
        return new HttpError(400, message, 'BAD_REQUEST', details);
    }

    static unauthorized(message = 'Authentication required') {
        return new HttpError(401, message, 'UNAUTHORIZED');
    }

    static forbidden(message = 'Insufficient permissions') {
        return new HttpError(403, message, 'FORBIDDEN');
    }

    static notFound(message = 'Resource not found') {
        return new HttpError(404, message, 'NOT_FOUND');
    }

    static conflict(message, details) {
        return new HttpError(409, message, 'CONFLICT', details);
    }
}

module.exports = HttpError;
