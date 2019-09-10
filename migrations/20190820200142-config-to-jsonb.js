const yaml = require('js-yaml');

const cmdGetSites = 'SELECT id, config, "demoConfig", "previewConfig" from site where '
  + 'config is not null OR "demoConfig" is not null OR "previewConfig" is not null;';

const convertSiteConfigsToJSON = (db, site) => {
  
  const atts = [];
  if (site.config) {
    atts.push(`${"config = '" + JSON.stringify(yaml.safeLoad(site.config.trim())) + "'"}`);
  }

  if (site.demoConfig) {
    atts.push(`${"\"demoConfig\" = '" + JSON.stringify(yaml.safeLoad(site.demoConfig.trim())) + "'"}`);
  }

  if (site.previewConfig) {
    atts.push(`${"\"previewConfig\" = '" + JSON.stringify(yaml.safeLoad(site.previewConfig.trim())) + "'"}`);
  }

  const cmdUpdateSiteRecord = `
    UPDATE
      site
    SET
      ${atts.join(', ')}
    WHERE
      id = ${site.id};`;

  
  return db.runSql(cmdUpdateSiteRecord);
}

const convertAllSitesConfigsToJSON = (db) => 
  db.runSql(cmdGetSites)
    .then(sites => Promise.all(sites.rows.map(site => convertSiteConfigsToJSON(db,site))));

exports.up = (db, callback) => 
  convertAllSitesConfigsToJSON(db)
  .then(() => db.changeColumn('site', 'config', 'jsonb'))
  .then(() => db.changeColumn('site', 'demoConfig', 'jsonb'))
  .then(() => db.changeColumn('site', 'previewConfig', 'jsonb'))
  .then(() => callback())
  .catch(callback);

const convertSiteConfigsToYAML = (db, site) => {
  
  const atts = [];
  if (site.config) {
    atts.push(`config = '${yaml.safeDump(JSON.parse(site.config))}'`);
  }

  if (site.demoConfig) {
    atts.push(`"demoConfig" = '${yaml.safeDump(JSON.parse(site.demoConfig))}'`);
  }

  if (site.previewConfig) {
    atts.push(`"previewConfig" = '${yaml.safeDump(JSON.parse(site.previewConfig))}'`);
  }

  const cmdUpdateSiteRecord = `
    UPDATE
      site
    SET
      ${atts.join(', ')}
    WHERE
      id = ${site.id}`;

  return db.runSql(cmdUpdateSiteRecord);
}

const convertAllSitesConfigsToYAML = (db) =>
  db.runSql(cmdGetSites)
    .then(sites => Promise.all(sites.rows.map(site => convertSiteConfigsToYAML(db,site))));

exports.down = (db, callback) => convertAllSitesConfigsToYAML(db)
  .then(() => db.changeColumn('site', 'config', 'text'))
  .then(() => db.changeColumn('site', 'demoConfig', 'text'))
  .then(() => db.changeColumn('site', 'previewConfig', 'text'))
  .then(() => callback())
  .catch(callback);
