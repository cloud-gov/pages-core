const yaml = require('js-yaml');

const cmdGetSitesText = 'SELECT id, config, "demoConfig", "previewConfig" from site where '
  + '(config is not null AND TRIM(config) <> \'\')'
  + ' OR ("demoConfig" is not null AND TRIM("demoConfig") <> \'\')'
  + ' OR ("previewConfig" is not null AND TRIM("previewConfig") <> \'\')';

const convertSiteConfigsToJSON = (db, site) => {
  const atts = [];
  if (site.config && site.config.trim().length > 0) {
    atts.push(`"defaultConfig" = '${JSON.stringify(yaml.load(site.config.trim()))}'::jsonb`);
  }

  if (site.demoConfig && site.demoConfig.trim().length > 0) {
    atts.push(`"demoConfig" = '${JSON.stringify(yaml.load(site.demoConfig.trim()))}'::jsonb`);
  }

  if (site.previewConfig && site.previewConfig.trim().length > 0) {
    atts.push(`"previewConfig" = '${JSON.stringify(yaml.load(site.previewConfig.trim()))}'::jsonb`);
  }

  const cmdUpdateSiteRecord = `
    UPDATE
      site
    SET
      ${atts.join(', ')}
    WHERE
      id = ${site.id};`;

  return db.runSql(cmdUpdateSiteRecord);
};

const convertAllSitesConfigsToJSON = (db, sites) => Promise.all(sites.rows.map(site => convertSiteConfigsToJSON(db, site)));

exports.up = (db, callback) => {
  let sites;
  db.runSql(cmdGetSitesText)
    .then((_sites) => {
      sites = _sites;
      return db.addColumn('site', 'defaultConfig', 'jsonb');
    })
    .then(() => db.renameColumn('site', 'demoConfig', 'tempDemoConfig'))
    .then(() => db.addColumn('site', 'demoConfig', 'jsonb'))
    .then(() => db.renameColumn('site', 'previewConfig', 'tempPreviewConfig'))
    .then(() => db.addColumn('site', 'previewConfig', 'jsonb'))
    .then(() => convertAllSitesConfigsToJSON(db, sites))
    .then(() => db.removeColumn('site', 'tempDemoConfig'))
    .then(() => db.removeColumn('site', 'tempPreviewConfig'))
    .then(() => db.removeColumn('site', 'config'))
    .then(() => callback())
    .catch(callback);
};

const convertSiteConfigsToYAML = (db, site) => {
  const atts = [];
  if (site.defaultConfig) {
    atts.push(`config = '${yaml.safeDump(site.defaultConfig)}'`);
  }

  if (site.demoConfig) {
    atts.push(`"tempDemoConfig" = '${yaml.safeDump(site.demoConfig)}'`);
  }

  if (site.previewConfig) {
    atts.push(`"tempPreviewConfig" = '${yaml.safeDump(site.previewConfig)}'`);
  }

  const cmdUpdateSiteRecord = `
    UPDATE
      site
    SET
      ${atts.join(', ')}
    WHERE
      id = ${site.id}`;

  return db.runSql(cmdUpdateSiteRecord);
};

const cmdGetSitesJSON = 'SELECT id, "defaultConfig", "demoConfig", "previewConfig" from site where '
  + '("defaultConfig" is not null)'
  + ' OR ("demoConfig" is not null)'
  + ' OR ("previewConfig" is not null)';

const convertAllSitesConfigsToYAML = (db, sites) => Promise.all(sites.rows.map(site => convertSiteConfigsToYAML(db, site)));

exports.down = (db, callback) => {
  let sites;
  db.runSql(cmdGetSitesJSON)
    .then((_sites) => {
      sites = _sites;
      return db.addColumn('site', 'config', 'text');
    })
    .then(() => db.addColumn('site', 'tempDemoConfig', 'text'))
    .then(() => db.addColumn('site', 'tempPreviewConfig', 'text'))
    .then(() => convertAllSitesConfigsToYAML(db, sites))
    .then(() => db.removeColumn('site', 'defaultConfig'))
    .then(() => db.removeColumn('site', 'demoConfig'))
    .then(() => db.removeColumn('site', 'previewConfig'))
    .then(() => db.renameColumn('site', 'tempDemoConfig', 'demoConfig'))
    .then(() => db.renameColumn('site', 'tempPreviewConfig', 'previewConfig'))
    .then(() => callback())
    .catch(callback);
};
