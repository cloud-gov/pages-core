const PublishedBranchSerializer = require('../serializers/published-branch');
const S3PublishedFileLister = require('../services/S3PublishedFileLister');
const siteAuthorizer = require('../authorizers/site');
const { Site } = require('../models');

module.exports = {
  find: (req, res) => {
    let site;
    let files;
    const branch = req.params.branch;

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
    .then(() => S3PublishedFileLister.listPublishedFilesForBranch(site, branch))
    .then((resolvedFiles) => {
      files = resolvedFiles;
      return PublishedBranchSerializer.serialize(site, branch);
    })
    .then((branchJSON) => {
      res.json(files.map(file => Object.assign(file, { publishedBranch: branchJSON })));
    })
    .catch(res.error);
  },
};
