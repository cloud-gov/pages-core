const { generateSubdomain, generateS3ServiceName } = require('../api/utils');

const getSites = 'SELECT id, owner, repository from site';
const cmdUpdateSiteSubdomain = (site) =>
  `UPDATE site SET subdomain = '${generateSubdomain(site.owner, site.repository)}' WHERE id = ${site.id}`;
const cmdRevertSiteSubdomain = (site) =>
  `UPDATE site SET subdomain = '${generateS3ServiceName(site.owner, site.repository)}' WHERE id = ${site.id}`;

exports.up = (db, callback) =>
  db
    .runSql(getSites)
    .then((sites) =>
      Promise.all(sites.rows.map((site) => db.runSql(cmdUpdateSiteSubdomain(site)))),
    )
    .then(() => callback())
    .catch(callback);

exports.down = (db, callback) =>
  db
    .runSql(getSites)
    .then((sites) =>
      Promise.all(sites.rows.map((site) => db.runSql(cmdRevertSiteSubdomain(site)))),
    )
    .then(() => callback())
    .catch(callback);
