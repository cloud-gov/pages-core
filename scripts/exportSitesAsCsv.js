var path = require('path');

var _ = require('underscore');
var jsonToCSV = require('json-to-csv');
var sails = require('sails');

function resolveDestination(d) {
  var relativePathRegex = /^\.\//;
  var fullPathRegex = /^[~/]/;
  var destination = d;
  if (d.match(relativePathRegex)) {
    destination = ['..', d].join('/');
    return path.resolve([__dirname, destination].join('/'));
  } else if (d.match(fullPathRegex)) {
    return destination;
  }
  return destination;
}

function sitesFromUsers(users) {
  return _.flatten(users.map(function(user) {
    return user.sites.map(function(site) {
      return {
        id: site.id,
        github: [site.owner, site.repository].join('/'),
        domain: site.domain,
        users: [user.username]
      };
    });
  }));
}

function consolidateOnSiteId(sites) {
  var ids = sites.map(function(site) {
    return site.id;
  });

  return ids.map(function(id) {
    var sitesById = _.where(sites, { id: id });
    var users = sitesById.map(function(site) {
      return site.users[0];
    });
    return Object.assign({}, sites[0], { users: users });
  });
}

function main(err, app) {
  var args = Array.prototype.slice.call(process.argv);
  var destination = resolveDestination(args[2] || './current-sites.csv');

  if (err) return console.log('Error occurred lifting Sails app', err);

  console.log('Final output can be found at', destination);
  console.log('\tUse npm run export -- /other/path/file.csv to change');

  return User.find({})
    .populate('sites')
    .then(sitesFromUsers)
    .then(consolidateOnSiteId)
    .then(function(sites) {
      return sites.map(function(site) {
        return Object.assign({}, site, { users: site.users.join(', ') })
      });
    })
    .then(function(sites) {
      console.log('Found ' + sites.length + ' unique sites');
      return sites;
    })
    .then(function(sites) {
      return jsonToCSV(sites, destination)
    })
    .then(function() {
      console.log('Current sites written to file', destination);
    })
    .then(function() {
      sails.lower();
    })
    .catch(function(err) {
      console.log('An error occurred', err);
    });
}

sails.lift({}, main);
