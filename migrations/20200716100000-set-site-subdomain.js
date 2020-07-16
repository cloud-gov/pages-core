const yaml = require('js-yaml');
const { generateS3ServiceName } = require('../api/utils');

const cmdUpdateDedicatedBucketSitesSubdomain = 'UPDATE site SET subdomain = "s3ServiceName" WHERE "s3ServiceName" !~ \'federalist-(production|staging)-s3\'';
const getSharedBucketSites = 'SELECT id, owner, repository from site WHERE "s3ServiceName" ~ \'federalist-(production|staging)-s3\'';
const cmdUpdateSiteSubdomain = site => `UPDATE site SET subdomain = '${generateS3ServiceName(site.owner, site.repository)}' WHERE id = ${site.id}`;
const cmdUnsetAllSiteSubdomains = 'UPDATE site SET subdomain = null';

exports.up = (db, callback) => db.runSql(cmdUpdateDedicatedBucketSitesSubdomain)
  	.then(() => db.runSql(getSharedBucketSites))
    .then((sites) => Promise.all(sites.rows.map(site => db.runSql(cmdUpdateSiteSubdomain(site)))))
    .then(() => callback())
    .catch(callback);

exports.down = (db, callback) => db.runSql(cmdUnsetAllSiteSubdomains)
    .then(() => callback())
    .catch(callback);
