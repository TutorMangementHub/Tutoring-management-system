const http = require('node:http');

const createApp = require('./app');

const app = createApp();

/** Keeps the historical `createServer()` entry point used by the tests. */
function createServer() {
    return http.createServer(app);
}

module.exports = {
    app,
    createServer,
    securityHeaders: createApp.securityHeaders,
    SERVICE_NAME: createApp.SERVICE_NAME,
};
