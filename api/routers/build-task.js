const router = require('express').Router();
const BuildTaskController = require('../controllers/build-task');
const { sessionAuth } = require('../middlewares');

router.get('/build/:build_id/tasks', sessionAuth, BuildTaskController.list);
router.get('/build/:build_id/tasks/:build_task_id', sessionAuth, BuildTaskController.find);
router.put('/tasks/:build_task_id/:token', BuildTaskController.update);

module.exports = router;
