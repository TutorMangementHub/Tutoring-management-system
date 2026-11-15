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
            },
        },
    ],
};
