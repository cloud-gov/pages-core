const PublishedBranchSerializer = require('../serializers/published-branch');
const S3PublishedFileLister = require('../services/S3PublishedFileLister');
const siteAuthorizer = require('../authorizers/site');
const { Build, Site } = require('../models');

module.exports = {
  find: (req, res) => {
    let site;
    let branchNames;
    const siteId = Number(req.params.site_id);

    // TODO:
    // Build.findAll({
    //   where: { site: site.id },
    //   order: [['createdAt', 'desc']],
    //   limit: 100,
    // })
    Promise.resolve(siteId)
      .then((id) => {
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
      .then(() => S3PublishedFileLister.listPublishedPreviews(site))
      .then((publishedBranchNames) => {
        branchNames = publishedBranchNames;
      })
      .then(() => {
        let finalBranchNames = branchNames.slice();

        if (site.demoBranch) {
          finalBranchNames = finalBranchNames.filter(branchName => branchName !== site.demoBranch);
          finalBranchNames = [site.demoBranch].concat(finalBranchNames);
        }
        finalBranchNames = [site.defaultBranch].concat(finalBranchNames);
        branchNames = finalBranchNames;
      })
      .then(() => PublishedBranchSerializer.serialize(site, branchNames))
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
    const siteId = Number(req.params.site_id);

    Promise.resolve(siteId)
      .then((id) => {
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
