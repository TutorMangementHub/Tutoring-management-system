const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { clientOrigin, cookieSecure } = require('./config/env');
const db = require('./config/db');
const apiRouter = require('./routes');
const { apiLimiter } = require('./middleware/rate-limit');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const openapi = require('./openapi');
const webAuthRoutes = require('./routes/web/auth.routes');
const webGroupRoutes = require('./routes/web/group.routes');
const webFreeSlotRoutes = require('./routes/web/freeSlot.routes');

const SERVICE_NAME = 'tutoring-management-api';

/**
 * Helmet's defaults include `upgrade-insecure-requests`, which makes the
 * browser rewrite every http:// request on the page to https://. On a
 * deployment served over plain HTTP that breaks form posts (the login POST
 * becomes https://... and fails with ERR_SSL_PROTOCOL_ERROR). The directive
 * is only safe once the site is actually served over TLS.
 *
 * COOP, Origin-Agent-Cluster and HSTS are likewise only honoured on a
 * trustworthy (HTTPS) origin, so they are skipped on plain HTTP.
 */
function securityHeaders({ secure = cookieSecure } = {}) {
    if (secure) {
        return {};
    }

    const directives = { ...helmet.contentSecurityPolicy.getDefaultDirectives() };
    delete directives['upgrade-insecure-requests'];

    return {
        // Helmet merges `directives` into its defaults by default, which would
        // put `upgrade-insecure-requests` straight back.
        contentSecurityPolicy: { useDefaults: false, directives },
        crossOriginOpenerPolicy: false,
        originAgentCluster: false,
        strictTransportSecurity: false,
    };
}

function createApp() {
    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(helmet(securityHeaders()));
    app.use(
        cors({
            origin: clientOrigin === '*' ? true : clientOrigin.split(',').map((item) => item.trim()),
            credentials: true,
        }),
    );
    app.use(express.json({ limit: '100kb' }));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../public')));

    app.get(['/health', '/api/health'], (_request, response) => {
        response.json({
            status: 'ok',
            service: SERVICE_NAME,
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/openapi.json', (_request, response) => {
        response.json(openapi);
    });

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
        customSiteTitle: 'Tutoring Management API - Swagger UI',
        swaggerOptions: {
            persistAuthorization: true,
        },
    }));

    app.use('/', webAuthRoutes);
    app.use('/', webGroupRoutes);
    app.use('/', webFreeSlotRoutes);

    app.get('/health/ready', async (_request, response) => {
        await db.ping();
        response.json({ status: 'ready' });
    });

    app.use('/api', apiLimiter, apiRouter);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
module.exports.SERVICE_NAME = SERVICE_NAME;
module.exports.securityHeaders = securityHeaders;
