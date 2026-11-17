const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { clientOrigin } = require('./config/env');
const db = require('./config/db');
const apiRouter = require('./routes');
const { apiLimiter } = require('./middleware/rate-limit');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const asyncHandler = require('./middleware/async-handler');
const openapi = require('./openapi');
const webAuthRoutes = require('./routes/web/auth.routes');
const webGroupRoutes = require('./routes/web/group.routes');
const webFreeSlotRoutes = require('./routes/web/freeSlot.routes');

const SERVICE_NAME = 'tutoring-management-api';

function createApp() {
    const app = express();

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(helmet());
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

    app.get(
        '/health/ready',
        asyncHandler(async (_request, response) => {
            await db.ping();
            response.json({ status: 'ready' });
        }),
    );

    app.use('/api', apiLimiter, apiRouter);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
module.exports.SERVICE_NAME = SERVICE_NAME;
