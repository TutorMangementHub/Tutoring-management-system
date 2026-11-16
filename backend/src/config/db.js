const mongoose = require('mongoose');

const { mongodbUri } = require('../config/env');

mongoose.set('strictQuery', true);

/** Connects once and reuses the connection. */
async function connect(uri = mongodbUri) {
    if (!uri) {
        throw new Error('MONGODB_URI is required to connect to MongoDB');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
    });

    return mongoose.connection;
}

async function disconnect() {
    await mongoose.disconnect();
}

function isConnected() {
    return mongoose.connection.readyState === 1;
}

/** Readiness probe used by GET /health/ready. */
async function ping() {
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection is not established');
    }
    await mongoose.connection.db.admin().ping();
}

module.exports = {
    mongoose,
    connect,
    disconnect,
    isConnected,
    ping,
};
