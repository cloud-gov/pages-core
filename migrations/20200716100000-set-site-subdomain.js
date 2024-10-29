const { generateSubdomain } = require('../api/utils');

const getSites = 'SELECT id, owner, repository from site';
const cmdUpdateSiteSubdomain = (site) =>
  `UPDATE site SET subdomain = '${generateSubdomain(site.owner, site.repository)}' WHERE id = ${site.id}`;
const cmdUnsetAllSiteSubdomains = 'UPDATE site SET subdomain = null';

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
    .runSql(cmdUnsetAllSiteSubdomains)
    .then(() => callback())
    .catch(callback);
