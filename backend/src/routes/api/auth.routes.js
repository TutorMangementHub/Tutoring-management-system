const { Router } = require('express');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rate-limit');
const authenticateApi = require('../../middleware/authenticate-api');
const controller = require('../../controllers/api/auth.controller');
const { registerSchema, loginSchema } = require('../../schemas/user.schema');

const router = Router();

router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    controller.register,
);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/logout', authenticateApi, controller.logout);
router.get('/me', authenticateApi, controller.me);

module.exports = router;
