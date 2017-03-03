const GitHub = require("./GitHub")
const config = require("../../config")
const { Build, Site, User } = require("../models")

const createSite = ({ user, siteParams }) => {
  const template = siteParams.template
  siteParams = paramsForNewSite(siteParams)

  if (template) {
    return createSiteFromTemplate({ siteParams, template, user })
  } else {
    return createSiteFromExistingRepo({ siteParams, user })
  }
}

checkExistingGithubRepository = ({ user, owner, repository }) => {
  return GitHub.getRepository(user, owner, repository).then(repo => {
    if (!repo) {
      throw {
        message: `The repository ${owner}/${repository} does not exist.`,
        status: 400,
      }
    }
    if (!repo.permissions.push) {
      throw {
        message: "You do not have write access to this repository",
        status: 400,
      }
    }
    return true
  })
}

checkForExistingSiteErrors = ({ site, user }) => {
  const existingUser = site.Users.find(candidate => candidate.id === user.id)
  if (existingUser) {
    throw {
      message: "You've already added this site to Federalist",
      status: 400
    }
  }
  return site
}

createAndBuildSite = ({ siteParams, user }) => {
  let site = Site.build(siteParams)

  return site.validate().then(error => {
    if (error) {
      throw error
    }
    return GitHub.setWebhook(site, user.id)
  }).then(() => {
    return site.save()
  }).then(createdSite => {
    site = createdSite

    const buildParams = paramsForNewBuild({ site, user })
    return Build.create(buildParams)
  }).then(() => {
    return site
  })
}

const createSiteFromExistingRepo = ({ siteParams, user }) => {
  let site
  const { owner, repository } = siteParams

  return checkExistingGithubRepository({ user, owner, repository }).then(() => {
    return Site.findOne({
      where: { owner, repository },
      include: [ User ],
    })
  }).then(site => {
    if (site) {
      return checkForExistingSiteErrors({ site, user })
    } else {
      return createAndBuildSite({ siteParams, user })
    }
  }).then(model => {
    site = model
    return site.addUser(user.id)
  }).then(() => site)
}

const createSiteFromTemplate = ({ siteParams, user, template }) => {
  let site = Site.build(siteParams)
  site.engine = "jekyll"
  const { owner, repository } = siteParams

  return site.validate().then(error => {
    if (error) {
      throw error
    }
    return GitHub.createRepo(user, owner, repository)
  }).then(() => {
    return GitHub.setWebhook(site, user)
  }).then(() => {
    return site.save()
  }).then(createdSite => {
    site = createdSite
    return site.addUser(user.id)
  }).then(() => {
    const buildParams = paramsForNewBuild({ user, site, template })
    return Build.create(buildParams)
  }).then(() => site)
}

const paramsForNewBuild = ({ user, site, template }) => ({
  user: user.id,
  site: site.id,
  branch: site.defaultBranch,
  source: paramsForNewBuildSource(template),
})

const paramsForNewBuildSource = (templateName) => {
  if (templateName) {
    const template = config.templates[templateName]
    if (!template) {
      throw new Error(`No such template: ${templateName}`)
    }
    return { repository: template.repo, owner: template.owner }
  }
}

const paramsForNewSite = (params) => ({
  owner: params.owner,
  repository: params.repository,
  defaultBranch: params.defaultBranch,
  engine: params.engine,
})

const siteExists = ({ owner, repository }) => {
  return Promise.resolve(false)
}

module.exports = {
  createSite,
}
