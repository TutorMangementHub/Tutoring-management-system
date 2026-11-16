const { Router } = require('express');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rate-limit');
const authenticateApi = require('../../middleware/authenticate-api');
const controller = require('../../controllers/api/auth.controller');
const { registerSchema, loginSchema } = require('../../schemas/user.schema');
const asyncHandler = require('../../middleware/async-handler');

const router = Router();

router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    asyncHandler(controller.register),
);
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post('/logout', authenticateApi, controller.logout);
router.get('/me', authenticateApi, asyncHandler(controller.me));

module.exports = router;
