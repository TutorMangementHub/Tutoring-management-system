const assert = require('node:assert/strict');
const test = require('node:test');

const { createServer, securityHeaders } = require('../src');

async function fetchLogin(headers) {
    const server = createServer().listen(0, '127.0.0.1');
    try {
        await new Promise((resolve) => server.once('listening', resolve));
        const { port } = server.address();
        const response = await fetch(`http://127.0.0.1:${port}/login`, { headers });
        await response.arrayBuffer();
        return response;
    } finally {
        server.close();
    }
}

test('plain HTTP responses do not upgrade insecure requests', async () => {
    const response = await fetchLogin();
    const csp = response.headers.get('content-security-policy') || '';

    assert.equal(response.status, 200);
    assert.ok(csp.includes("default-src 'self'"), 'CSP is still applied');
    assert.ok(
        !csp.includes('upgrade-insecure-requests'),
        'HTTP pages must not force form posts to https',
    );
});

test('plain HTTP responses skip headers that need a trustworthy origin', async () => {
    const response = await fetchLogin();

    assert.equal(response.headers.get('cross-origin-opener-policy'), null);
    assert.equal(response.headers.get('origin-agent-cluster'), null);
    assert.equal(response.headers.get('strict-transport-security'), null);
});

test('securityHeaders keeps helmet defaults when serving over HTTPS', () => {
    const options = securityHeaders({ secure: true });

    assert.deepEqual(options, {});
});

test('securityHeaders removes the upgrade directive for plain HTTP', () => {
    const { contentSecurityPolicy } = securityHeaders({ secure: false });

    assert.ok(contentSecurityPolicy.directives["default-src"], 'default-src is preserved');
    assert.equal(
        contentSecurityPolicy.directives['upgrade-insecure-requests'],
        undefined,
        'upgrade-insecure-requests is removed',
    );
});
