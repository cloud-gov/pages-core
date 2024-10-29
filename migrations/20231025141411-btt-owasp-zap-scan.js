const { DEFAULT_BUILD_TASK_PARAMS } = require('../api/utils');

const TABLE = 'build_task_type';
const TASK_TYPE_NAME = 'OWASP ZAP Vulnerability Scan';
const env = process.env.APP_ENV || 'local';

exports.up = async (db, callback) => {
  await db.addColumn(TABLE, 'url', { type: 'string' });
  await db.insert(
    TABLE,
    [
      'name',
      'description',
      'metadata',
      'createdAt',
      'updatedAt',
      'runner',
      'startsWhen',
      'url',
    ],
    [
      TASK_TYPE_NAME,
      'This scan identifies potential website security issues like unintended exposure of sensitive data, SQL injection opportunities, cross-site scripting (XSS) flaws, and the use of components with known vulnerabilities.',
      {
        appName: `pages-owasp-zap-task-${env}`,
        template: {
          command: `zap/run_pages_task.py -t {{task.Build.url}} ${DEFAULT_BUILD_TASK_PARAMS}`,
          disk_in_mb: 3000,
        },
      },
      new Date(),
      new Date(),
      'cf_task',
      'complete',
      'https://www.zaproxy.org/',
    ],
    callback,
  );
};

exports.down = async (db) => {
  await db.runSql(`delete from "${TABLE}" where name=\'${TASK_TYPE_NAME}\'`);
  await db.removeColumn(TABLE, 'url');
};
