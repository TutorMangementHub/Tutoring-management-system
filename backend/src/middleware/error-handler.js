const HttpError = require('../utils/http-error');

function sendError(response, status, code, message, details) {
    const payload = { error: { code, message } };
    if (details !== undefined) {
        payload.error.details = details;
    }
    response.status(status).json(payload);
}

/* eslint-disable-next-line no-unused-vars */
function errorHandler(error, _request, response, _next) {
    if (error instanceof HttpError) {
        sendError(response, error.status, error.code, error.message, error.details);
        return;
    }

    if (error.name === 'ValidationError') {
        const details = Object.values(error.errors).map((issue) => ({
            path: issue.path,
            message: issue.message,
        }));
        sendError(response, 400, 'VALIDATION_ERROR', 'Validation failed', details);
        return;
    }

    if (error.name === 'CastError') {
        sendError(response, 400, 'INVALID_ID', `Invalid identifier for ${error.path}`);
        return;
    }

    if (error.code === 11000) {
        sendError(response, 409, 'DUPLICATE_KEY', 'A record with these values already exists', error.keyValue);
        return;
    }

    if (error.type === 'entity.parse.failed') {
        sendError(response, 400, 'INVALID_JSON', 'Request body is not valid JSON');
        return;
    }

    console.error('Unhandled error', error);
    sendError(response, 500, 'INTERNAL_ERROR', 'Internal server error');
}

module.exports = errorHandler;
