const { DEFAULT_BUILD_TASK_PARAMS } = require('../api/utils');

const TABLE = 'build_task_type';
const TASK_TYPE_NAME = 'Accessibility Scan'
const env = process.env.APP_ENV || 'local'

exports.up = async (db, callback) => {
  await db.insert(TABLE,
    ['name', 'description', 'metadata', 'createdAt', 'updatedAt', 'runner', 'startsWhen', 'url'],
    [
      TASK_TYPE_NAME,
      'This scan identifies website accessibility violations from Section 508 and the latest WCAG version',
      {
        "appName": `pages-a11y-task-${env}`,
        "template": {
          "command": `python build-task/main.py -t {{task.Build.url}} -b {{task.Build.id}} -o {{task.Build.Site.owner}} -r {{task.Build.Site.repository}} ${DEFAULT_BUILD_TASK_PARAMS}`,
          "disk_in_mb": 4000
        }
      },
      new Date(),
      new Date(),
      'cf_task',
      'complete',
      'https://www.deque.com/axe/'
    ],
    callback
  );
};

exports.down = async db => {
  await db.runSql(`delete from "${TABLE}" where name=\'${TASK_TYPE_NAME}\'`);
};

