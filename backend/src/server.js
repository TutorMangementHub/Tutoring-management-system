const { createServer } = require('./index');
const env = require('./config/env');
const db = require('./config/db');

const server = createServer();

async function start() {
    await db.connect();
    console.log(`Connected to MongoDB database "${db.mongoose.connection.name}"`);

    server.listen(env.port, env.host, () => {
        console.log(`Tutoring API listening on http://${env.host}:${env.port}`);
    });
}

function shutdown(signal) {
    console.log(`${signal} received; shutting down`);

    server.close(async (error) => {
        if (error) {
            console.error('Error while closing the HTTP server', error);
            process.exitCode = 1;
        }

        try {
            await db.disconnect();
        } catch (dbError) {
            console.error('Error while closing the database connection', dbError);
            process.exitCode = 1;
        }

        process.exit();
    });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
    console.error('Failed to start the API', error);
    process.exit(1);
});
