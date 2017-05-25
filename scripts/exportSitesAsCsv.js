/* eslint no-console: 0 */
const path = require('path');

const _ = require('underscore');
const jsonToCSV = require('json-to-csv');

const { User, Site } = require('../api/models');

function resolveDestination(d) {
  const relativePathRegex = /^\.\//;
  const fullPathRegex = /^[~/]/;
  let destination = d;
  if (d.match(relativePathRegex)) {
    destination = ['..', d].join('/');
    return path.resolve([__dirname, destination].join('/'));
  } else if (d.match(fullPathRegex)) {
    return destination;
  }
  return destination;
}

function sitesFromUsers(users) {
  return _.flatten(users.map(user => user.Sites.map(site => ({
    id: site.id,
    github: [site.owner, site.repository].join('/'),
    domain: site.domain,
    users: [user.username],
  }))));
}

function consolidateOnSiteId(sites) {
  const ids = sites.map(site => site.id);

  return ids.map((id, i) => {
    const sitesById = _.where(sites, { id });
    const users = sitesById.map(site => site.users[0]);

    return Object.assign({}, sites[i], { users });
  });
}


const args = Array.prototype.slice.call(process.argv);
const destination = resolveDestination(args[2] || './current-sites.csv');
console.log('Final output can be found at', destination);
console.log('\tUse npm run export:sites -- /other/path/file.csv to change');

return User.findAll({ include: [Site] })
  .then(sitesFromUsers)
  .then(consolidateOnSiteId)
  .then(sites => sites.map(site => Object.assign({}, site, { users: site.users.join(', ') })))
  .then((sites) => {
    console.log(`Found ${sites.length} unique sites`);
    return sites;
  })
  .then(sites => jsonToCSV(sites, destination))
  .then(() => {
    console.log('Current sites written to file', destination);
  })
  .catch((err) => {
    console.log('An error occurred', err);
  });
