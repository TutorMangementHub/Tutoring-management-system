/** Wraps async route handlers so rejected promises reach the error middleware. */
function asyncHandler(handler) {
    return function wrapped(request, response, next) {
        Promise.resolve(handler(request, response, next)).catch(next);
    };
}

module.exports = asyncHandler;
