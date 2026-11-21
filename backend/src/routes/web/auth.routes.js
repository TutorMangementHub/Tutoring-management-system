const { Router } = require('express');
const controller = require('../../controllers/web/auth.controller');
const authLimiter = require('../../middleware/rate-limit').authLimiter;
const authenticateWeb = require('../../middleware/authenticate-web');
const redirectAuthenticatedWeb = require('../../middleware/redirect-authenticated-web');

const router = Router();

router.get('/login', redirectAuthenticatedWeb, controller.loginPage);
router.post('/login', authLimiter, controller.login);
router.post('/logout', authenticateWeb, controller.logout);

module.exports = router;
