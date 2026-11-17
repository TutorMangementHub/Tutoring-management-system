const { Router } = require('express');
const asyncHandler = require('../../middleware/async-handler');
const controller = require('../../controllers/api/group.controller');
const authenticateApi = require('../../middleware/authenticate-api');
const { authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createGroupSchema } = require('../../schemas/group.schema');

const router = Router();
router.get('/', asyncHandler(controller.list));
router.post(
    '/',
    authenticateApi,
    authorize('TEACHER'),
    validate(createGroupSchema),
    asyncHandler(controller.create),
);
router.get(
    '/:id/students',
    authenticateApi,
    authorize('TEACHER'),
    asyncHandler(controller.listStudents),
);
router.delete(
    '/:id/students/:studentId',
    authenticateApi,
    authorize('TEACHER'),
    asyncHandler(controller.removeStudent),
);
module.exports = router;
