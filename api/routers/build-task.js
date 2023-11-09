const router = require('express').Router();
const BuildTaskController = require('../controllers/build-task');
const BuildTaskTypeController = require('../controllers/build-task-type');
const { sessionAuth } = require('../middlewares');

router.get('/build/:build_id/tasks', sessionAuth, BuildTaskController.list);
router.get('/build/:build_id/tasks/:build_task_id', sessionAuth, BuildTaskController.find);
router.put('/tasks/:build_task_id/:token', BuildTaskController.update);
router.get('/tasks/types', BuildTaskTypeController.list);

module.exports = router;