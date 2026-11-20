/**
 * OpenAPI 3.0 description for the API surface that is currently implemented.
 * Keeping this as JavaScript avoids adding a runtime Swagger dependency.
 */
const openapi = {
    openapi: '3.0.3',
    info: {
        title: 'Tutoring Management API',
        version: '1.0.0',
        description: 'Authentication, health and tutoring-management API.',
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
    ],
    tags: [
        { name: 'Health', description: 'Application and database health checks' },
        { name: 'Authentication', description: 'Student registration and account authentication' },
        { name: 'Groups', description: 'Teacher-managed student groups' },
        { name: 'Sessions', description: 'Study sessions seen by students' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Check that the API process is alive',
                operationId: 'getHealth',
                responses: {
                    200: {
                        description: 'API is alive',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
                    },
                },
            },
        },
        '/api/health': {
            get: {
                tags: ['Health'],
                summary: 'API health check under the API prefix',
                operationId: 'getApiHealth',
                responses: {
                    200: {
                        description: 'API is alive',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
                    },
                },
            },
        },
        '/health/ready': {
            get: {
                tags: ['Health'],
                summary: 'Check API and MongoDB readiness',
                operationId: 'getReadiness',
                responses: {
                    200: {
                        description: 'MongoDB is reachable',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ReadyResponse' } } },
                    },
                    500: {
                        description: 'MongoDB is not reachable',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
                    },
                },
            },
        },
        '/api/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a student account',
                description: 'Creates a STUDENT account and returns a JWT Bearer token.',
                operationId: 'register',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
                },
                responses: {
                    201: {
                        description: 'Student account created and authenticated',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
                    },
                    400: { $ref: '#/components/responses/ValidationError' },
                    409: { $ref: '#/components/responses/ConflictError' },
                },
            },
        },
        '/api/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Log in',
                operationId: 'login',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
                },
                responses: {
                    200: {
                        description: 'Authenticated',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
                    },
                    400: { $ref: '#/components/responses/ValidationError' },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                },
            },
        },
        '/api/auth/logout': {
            post: {
                tags: ['Authentication'],
                summary: 'Log out',
                operationId: 'logout',
                security: [{ bearerAuth: [] }],
                responses: {
                    204: { description: 'Cookie cleared' },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                },
            },
        },
        '/api/auth/me': {
            get: {
                tags: ['Authentication'],
                summary: 'Get the authenticated user profile',
                operationId: 'getCurrentUser',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
                    },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                    404: { $ref: '#/components/responses/NotFoundError' },
                },
            },
        },
        '/api/groups': {
            get: {
                tags: ['Groups'],
                summary: 'List active student groups',
                operationId: 'listGroups',
                responses: {
                    200: {
                        description: 'Active groups',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Group' } } } },
                    },
                },
            },
            post: {
                tags: ['Groups'],
                summary: 'Create a student group',
                operationId: 'createGroup',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateGroupRequest' } } },
                },
                responses: {
                    201: {
                        description: 'Group created',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Group' } } },
                    },
                    400: { $ref: '#/components/responses/ValidationError' },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                    403: { $ref: '#/components/responses/ForbiddenError' },
                    409: { $ref: '#/components/responses/ConflictError' },
                },
            },
        },
        '/api/sessions/mine': {
            get: {
                tags: ['Sessions'],
                summary: 'Calendar of my group (logged-in student)',
                operationId: 'getMyCalendar',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'from', in: 'query', schema: { type: 'string', example: '2026-11-01' }, description: 'First day (YYYY-MM-DD)' },
                    { name: 'to', in: 'query', schema: { type: 'string', example: '2026-11-30' }, description: 'Last day (YYYY-MM-DD)' },
                ],
                responses: {
                    200: {
                        description: 'Sessions sorted by date then start time',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
                    },
                    400: { $ref: '#/components/responses/ValidationError' },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                    403: { $ref: '#/components/responses/ForbiddenError' },
                    404: { $ref: '#/components/responses/NotFoundError' },
                },
            },
        },
        '/api/sessions/mine/upcoming': {
            get: {
                tags: ['Sessions'],
                summary: 'Next sessions of my group (logged-in student)',
                operationId: 'getMyUpcomingSessions',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50, default: 5 } },
                ],
                responses: {
                    200: {
                        description: 'Upcoming sessions',
                        content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Session' } } } },
                    },
                    400: { $ref: '#/components/responses/ValidationError' },
                    401: { $ref: '#/components/responses/UnauthorizedError' },
                    403: { $ref: '#/components/responses/ForbiddenError' },
                    404: { $ref: '#/components/responses/NotFoundError' },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'API clients send this token in the Authorization header. Web pages use the httpOnly tms_token cookie separately.',
            },
        },
        schemas: {
            HealthResponse: {
                type: 'object',
                required: ['status', 'service', 'timestamp'],
                properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'tutoring-management-api' },
                    timestamp: { type: 'string', format: 'date-time' },
                },
            },
            ReadyResponse: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', example: 'ready' } },
            },
            RegisterRequest: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                    fullName: { type: 'string', minLength: 1, example: 'Student One' },
                    email: { type: 'string', format: 'email', example: 'student@example.com' },
                    password: { type: 'string', minLength: 8, format: 'password', example: 'Student123!' },
                },
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'student@example.com' },
                    password: { type: 'string', format: 'password', example: 'Student123!' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '65f000000000000000000000' },
                    role: { type: 'string', enum: ['TEACHER', 'STUDENT'] },
                    fullName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    isActive: { type: 'boolean' },
                    groupId: { type: 'string', nullable: true },
                },
            },
            AuthResponse: {
                type: 'object',
                required: ['token', 'user'],
                properties: {
                    token: { type: 'string', description: 'JWT Bearer token' },
                    user: { $ref: '#/components/schemas/User' },
                },
            },
            CreateGroupRequest: {
                type: 'object',
                required: ['gradeId', 'number', 'name'],
                properties: {
                    gradeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                    number: { type: 'integer', minimum: 1 },
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    isActive: { type: 'boolean', default: true },
                },
            },
            Group: {
                type: 'object',
                required: ['_id', 'gradeId', 'number', 'name', 'isActive', 'studentCount'],
                properties: {
                    _id: { type: 'string' },
                    gradeId: { type: 'object', properties: { _id: { type: 'string' }, level: { type: 'string' } } },
                    number: { type: 'integer' },
                    name: { type: 'string' },
                    isActive: { type: 'boolean' },
                    studentCount: { type: 'integer', minimum: 0 },
                },
            },
            Session: {
                type: 'object',
                required: ['id', 'title', 'sessionDate', 'startMin', 'endMin', 'groups'],
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string', example: 'Math revision' },
                    sessionDate: { type: 'string', format: 'date-time', description: 'Midnight UTC of the session day' },
                    startMin: { type: 'integer', description: 'Minutes since midnight', example: 540 },
                    endMin: { type: 'integer', description: 'Minutes since midnight', example: 600 },
                    groups: { type: 'array', items: { type: 'string' }, example: ['Group 1'] },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                            details: { type: 'array', items: { type: 'object' } },
                        },
                    },
                },
            },
        },
        responses: {
            ValidationError: {
                description: 'Request validation failed',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            UnauthorizedError: {
                description: 'Authentication required or credentials are invalid',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            ForbiddenError: {
                description: 'Authenticated user does not have the required role',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            ConflictError: {
                description: 'A record with the supplied values already exists',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            NotFoundError: {
                description: 'Resource not found',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
        },
    },
};

module.exports = openapi;
