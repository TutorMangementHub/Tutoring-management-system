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
    SERVICE_NAME: createApp.SERVICE_NAME,
};
