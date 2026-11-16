const { Router } = require('express');
const asyncHandler = require('../../middleware/async-handler');
const controller = require('../../controllers/api/grade.controller');

const router = Router();
router.get('/', asyncHandler(controller.list));
module.exports = router;
