const { Router } = require('express');
const controller = require('../../controllers/api/group.controller');
const authenticateApi = require('../../middleware/authenticate-api');
const { authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { createGroupSchema } = require('../../schemas/group.schema');

const router = Router();
router.get('/', controller.list);
router.post(
    '/',
    authenticateApi,
    authorize('TEACHER'),
    validate(createGroupSchema),
    controller.create,
);
module.exports = router;
