/* eslint-disable no-console */
const { Build, BuildTask, SiteBuildTask } = require('../api/models');

const logHelper = '[run-scans-for-build]';

async function main() {
  try {
    const args = Array.prototype.slice.call(process.argv, 2);

    if (args.length !== 1) {
      throw `
        Please make sure you provide 1 arguments. (buildId).\n
        You provided the following: ${args}
      `;
    }

    const [buildId] = args;

    const build = await Build.findByPk(buildId);
    let tasks = [];
    try {
      // try to create build tasks, this will fail if they already
      // exist and throw a uniqueness violation
      tasks = await SiteBuildTask.createBuildTasks({ build });
      console.log(`${logHelper} Created ${tasks.length} new scan(s)`);
    } catch {
      // if there are existing build tasks, find these
      tasks = await BuildTask.findAll({
        where: {
          buildId: build.id,
        },
      });
      console.log(`${logHelper} Found ${tasks.length} existing scan(s)`);
    }

    await Promise.all(tasks.map(async (task) => task.enqueue()));

    console.log(`${logHelper} Successfully queued ${tasks.length} scan(s)`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
