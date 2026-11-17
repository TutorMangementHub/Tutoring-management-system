const { Router } = require('express');
const asyncHandler = require('../../middleware/async-handler');
const authenticateWeb = require('../../middleware/authenticate-web');
const { authorize } = require('../../middleware/auth');
const controller = require('../../controllers/web/freeSlot.controller');

const router = Router();

router.get(
    '/groups/:groupId/slots',
    authenticateWeb,
    authorize('TEACHER'),
    asyncHandler(controller.slotsPage),
);

router.post(
    '/groups/:groupId/slots',
    authenticateWeb,
    authorize('TEACHER'),
    asyncHandler(controller.create),
);

router.post(
    '/groups/:groupId/slots/:slotId/delete',
    authenticateWeb,
    authorize('TEACHER'),
    asyncHandler(controller.remove),
);

module.exports = router;
