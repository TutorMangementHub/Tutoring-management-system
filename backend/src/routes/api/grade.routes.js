const { Router } = require('express');
const controller = require('../../controllers/api/grade.controller');

const router = Router();
router.get('/', controller.list);
module.exports = router;
