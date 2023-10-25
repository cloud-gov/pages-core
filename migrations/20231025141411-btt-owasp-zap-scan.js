const { DEFAULT_BUILD_TASK_PARAMS } = require('../api/utils');

const TABLE = 'build_task_type';
const TASK_TYPE_NAME = 'owasp-zap-scan'
const env = process.env.APP_ENV || 'local'

exports.up = async (db, callback) => {
  await db.insert(TABLE,
    ['name', 'description', 'metadata', 'createdAt', 'updatedAt', 'runner', 'startsWhen'],
    [
      TASK_TYPE_NAME,
      'Runs an OWASP ZAP scan to find vulnerabilities in the built site',
      {
        "appName": `pages-owasp-zap-task-${env}`,
        "template": {
          "command": `zap/run_pages_task.py -t {{task.Build.url}} ${DEFAULT_BUILD_TASK_PARAMS}`,
          "disk_in_mb": 3000
        }
      },
      new Date(),
      new Date(),
      'cf_task',
      'complete'
    ],
    callback
  );
};

exports.down = async db => {
  await db.runSql(`delete from "${TABLE}" where name=\'${TASK_TYPE_NAME}\'`);
};

