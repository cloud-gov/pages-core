const PublishedBranchSerializer = require('../serializers/published-branch');
const S3PublishedFileLister = require('../services/S3PublishedFileLister');
const siteAuthorizer = require('../authorizers/site');
const { Site } = require('../models');

module.exports = {
  find: (req, res) => {
    let site;

    Promise.resolve(Number(req.params.site_id)).then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Site.findById(id);
    }).then((model) => {
      if (model) {
        site = model;
      } else {
        throw 404;
      }
      return siteAuthorizer.findOne(req.user, site);
    })
    .then(() => S3PublishedFileLister.listPublishedPreviews(site))
    .then((branchNames) => {
      let combinedBranchNames = branchNames.slice(0);

      if (site.demoBranch) {
        combinedBranchNames = branchNames.filter(branchName => branchName !== site.demoBranch);
        combinedBranchNames = [site.demoBranch].concat(combinedBranchNames);
      }

      combinedBranchNames = [site.defaultBranch].concat(combinedBranchNames);

      return PublishedBranchSerializer.serialize(site, combinedBranchNames);
    })
    .then((branches) => {
      res.json(branches);
    })
    .catch((err) => {
      res.error(err);
    });
  },

  findOne: (req, res) => {
    let site;
    const branch = req.params.branch;

    Promise.resolve(Number(req.params.site_id)).then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Site.findById(id);
    })
    .then((model) => {
      if (model) {
        site = model;
      } else {
        throw 404;
      }
      return siteAuthorizer.findOne(req.user, site);
    })
    .then(() => PublishedBranchSerializer.serialize(site, branch))
    .then((branchJSON) => {
      res.json(branchJSON);
    })
    .catch(res.error);
  },
};
