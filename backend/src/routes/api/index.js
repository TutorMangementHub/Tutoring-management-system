const { Router } = require('express');

const authRoutes = require('./auth.routes');
const gradeRoutes = require('./grade.routes');
const groupRoutes = require('./group.routes');
const userRoutes = require('./user.routes');
const sessionRoutes = require('./session.routes');
const notificationRoutes = require('./notification.routes');

/** API composition root: all routes here return JSON. */
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/grades', gradeRoutes);
apiRouter.use('/groups', groupRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/notifications', notificationRoutes);

module.exports = apiRouter;
