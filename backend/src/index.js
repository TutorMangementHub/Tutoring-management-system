const http = require('node:http');

const SERVICE_NAME = 'tutoring-management-api';

function sendJson(response, statusCode, payload) {
    const body = JSON.stringify(payload);

    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    response.end(body);
}

function requestHandler(request, response) {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
        sendJson(response, 200, {
            status: 'ok',
            service: SERVICE_NAME,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    if (request.method === 'GET' && url.pathname === '/') {
        sendJson(response, 200, {
            service: SERVICE_NAME,
            health: '/health',
        });
        return;
    }

    sendJson(response, 404, {
        error: 'Not Found',
        path: url.pathname,
    });
}

function createServer() {
    return http.createServer(requestHandler);
}

module.exports = {
    createServer,
    requestHandler,
};
