const { Router } = require('express');
const asyncHandler = require('../../middleware/async-handler');
const controller = require('../../controllers/api/session.controller');
const authenticateApi = require('../../middleware/authenticate-api');
const { authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { calendarQuerySchema, upcomingQuerySchema } = require('../../schemas/session.schema');

const router = Router();

// Both routes are for students only.
router.get(
    '/mine',
    authenticateApi,
    authorize('STUDENT'),
    validate(calendarQuerySchema, 'query'),
    asyncHandler(controller.mine),
);
router.get(
    '/mine/upcoming',
    authenticateApi,
    authorize('STUDENT'),
    validate(upcomingQuerySchema, 'query'),
    asyncHandler(controller.upcoming),
);

module.exports = router;
