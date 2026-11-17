const { Router } = require('express');
const asyncHandler = require('../../middleware/async-handler');
const authenticateWeb = require('../../middleware/authenticate-web');
const { authorize } = require('../../middleware/auth');
const controller = require('../../controllers/web/group.controller');

const router = Router();

router.get('/groups', authenticateWeb, authorize('TEACHER'), asyncHandler(controller.indexPage));
router.get('/groups/new', authenticateWeb, authorize('TEACHER'), asyncHandler(controller.createPage));
router.post('/groups', authenticateWeb, authorize('TEACHER'), asyncHandler(controller.create));

module.exports = router;
