module.exports = {
    apps: [
        {
            name: 'tutoring-management-api',
            script: 'src/server.js',
            cwd: '/home/mo/Tutoring-management-system/backend',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                HOST: '0.0.0.0',
                PORT: 3000,
                MONGODB_URI: process.env.MONGODB_URI,
                JWT_SECRET: process.env.JWT_SECRET,
                JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
                COOKIE_NAME: process.env.COOKIE_NAME || 'tms_token',
                COOKIE_SECURE: process.env.COOKIE_SECURE || 'true',
                CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',
            },
        },
    ],
};
