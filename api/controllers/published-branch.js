const PublishedBranchSerializer = require("../serializers/published-branch")
const S3PublishedFileLister = require("../services/S3PublishedFileLister")
const siteAuthorizer = require("../authorizers/site")
const { Site } = require("../models")

module.exports = {
  find: (req, res) => {
    let site

    Promise.resolve(Number(req.params["site_id"])).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return siteAuthorizer.findOne(req.user, site)
    }).then(() => {
      return S3PublishedFileLister.listPublishedPreviews(site)
    }).then(branchNames => {
      branchNames = [site.defaultBranch].concat(branchNames)
      return PublishedBranchSerializer.serialize(site, branchNames)
    }).then(branches => {
      res.json(branches)
    }).catch(err => {
      res.error(err)
    })
  },

  findOne: (req, res) => {
    let site
    const branch = req.params["branch"]

    Promise.resolve(Number(req.params["site_id"])).then(id => {
      if (isNaN(id)) {
        throw 404
      }
      return Site.findById(id)
    }).then(model => {
      if (model) {
        site = model
      } else {
        throw 404
      }
      return siteAuthorizer.findOne(req.user, site)
    }).then(() => {
      return S3PublishedFileLister.listPublishedFilesForBranch(site, branch)
    }).then(files => {
      return PublishedBranchSerializer.serialize(site, branch, files)
    }).then(branchJSON => {
      res.json(branchJSON)
    }).catch(res.error)
  },
}
