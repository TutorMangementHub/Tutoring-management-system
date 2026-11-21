const { Router } = require('express');
const authenticateWeb = require('../../middleware/authenticate-web');
const { authorize } = require('../../middleware/auth');
const controller = require('../../controllers/web/freeSlot.controller');

const router = Router();

router.get(
    '/groups/:groupId/slots',
    authenticateWeb,
    authorize('TEACHER'),
    controller.slotsPage,
);

router.post(
    '/groups/:groupId/slots',
    authenticateWeb,
    authorize('TEACHER'),
    controller.create,
);

router.post(
    '/groups/:groupId/slots/:slotId/delete',
    authenticateWeb,
    authorize('TEACHER'),
    controller.remove,
);

module.exports = router;
