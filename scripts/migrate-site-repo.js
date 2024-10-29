/* eslint-disable no-console */
const { siteRepoMigrator } = require('../api/services/SiteRepoMigrator');

async function main() {
  try {
    const args = Array.prototype.slice.call(process.argv, 2);

    if (args.length !== 4) {
      throw `
        Please make sure you provide 4 arguments. (siteId, uaaEmail, owner, repository).\n
        You provided the following: ${args}
      `;
    }

    const [siteId, email, owner, repository] = args;

    await siteRepoMigrator(siteId, email, { owner, repository });

    console.log(`Site Id: ${siteId} migrated to new repo ${owner}/${repository}`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
