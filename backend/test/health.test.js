const assert = require('node:assert/strict');
const test = require('node:test');

const { createServer } = require('../src');

test('GET /health returns a healthy API response', async (t) => {
    const server = createServer().listen(0, '127.0.0.1');
    t.after(() => server.close());

    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'tutoring-management-api');
});
