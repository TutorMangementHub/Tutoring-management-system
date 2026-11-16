#!/usr/bin/env node
/**
 * Applies mongo-schema.js equivalents with the MongoDB Node driver.
 * Used when `mongosh` is not installed, and safe to re-run.
 *
 *   npm run db:schema
 */
const path = require('node:path');

try {
    process.loadEnvFile(path.resolve(__dirname, '../.env'));
} catch (error) {
    if (error.code !== 'ENOENT') {
        throw error;
    }
}

const { MongoClient } = require('mongodb');

const definitions = require('./schema-validators');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is required (set it in backend/.env)');
    }

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });

    try {
        await client.connect();
        const db = client.db();
        console.log(`Applying schema to database "${db.databaseName}"`);

        for (const [name, definition] of Object.entries(definitions)) {
            const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
            const spec = {
                validator: definition.validator,
                validationLevel: 'strict',
                validationAction: 'error',
            };

            if (exists) {
                try {
                    await db.command({ collMod: name, ...spec });
                    console.log(`updated validator on ${name}`);
                } catch (error) {
                    console.warn(`could not update validator on ${name}: ${error.message}`);
                }
            } else {
                await db.createCollection(name, spec);
                console.log(`created ${name}`);
            }

            for (const index of definition.indexes) {
                await db.collection(name).createIndex(index.keys, index.options);
            }
            console.log(`ensured ${definition.indexes.length} index(es) on ${name}`);
        }

        console.log('Schema applied successfully');
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error('Failed to apply schema:', error.message);
    process.exitCode = 1;
});
