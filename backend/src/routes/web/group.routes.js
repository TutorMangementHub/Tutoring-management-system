const { Router } = require('express');
const authenticateWeb = require('../../middleware/authenticate-web');
const { authorize } = require('../../middleware/auth');
const controller = require('../../controllers/web/group.controller');

const router = Router();

router.get('/groups', authenticateWeb, authorize('TEACHER'), controller.indexPage);
router.get('/groups/new', authenticateWeb, authorize('TEACHER'), controller.createPage);
router.post('/groups', authenticateWeb, authorize('TEACHER'), controller.create);

router.get('/groups/:id/students', authenticateWeb, authorize('TEACHER'), controller.studentsPage);
router.post(
    '/groups/:id/students/:studentId/remove',
    authenticateWeb,
    authorize('TEACHER'),
    controller.removeStudent,
);
router.post('/groups/:id/delete', authenticateWeb, authorize('TEACHER'), controller.deleteGroup);

module.exports = router;
