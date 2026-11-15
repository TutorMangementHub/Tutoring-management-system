const { createServer } = require('./index');

const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const server = createServer();

server.listen(port, host, () => {
    console.log(`Tutoring API listening on http://${host}:${port}`);
});

function shutdown(signal) {
    console.log(`${signal} received; shutting down`);
    server.close((error) => {
        if (error) {
            console.error('Error while closing the server', error);
            process.exitCode = 1;
        }
        process.exit();
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
