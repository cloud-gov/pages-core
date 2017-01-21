module.exports.routes = {
  /**
    API
  */
  // Builds
  "post /v0/build": "BuildController.create",
  "get /v0/build": "BuildController.find",
  "get /v0/build/:id": "BuildController.findOne",

  // Build logs
  "get /v0/build/:build_id/log": "BuildLogController.find",

  // Sites
  "get /v0/site": "SiteController.find",
  "post /v0/site": "SiteController.create",
  "get /v0/site/:id": "SiteController.findOne",
  "put /v0/site/:id": "SiteController.update",
  "delete /v0/site/:id": "SiteController.destroy",

  // Users
  "get /v0/me": "UserController.me",
  "get /v0/user/usernames": "UserController.usernames",

  /**
    User exposed routes
  */

  // Auth
  "get /auth/github": "AuthController.github",
  "get /auth/github/callback": "AuthController.callback",
  "get /logout": "AuthController.logout",

  // Frontend
  "get /sites(/*)?": "MainController.index",

  // Previews
  "get /preview/:owner/:repo/:branch(/*)?": "PreviewController.proxy",

  /**
    Webhooks
  */
  "post /webhook/github": "WebhookController.github",

  /**
    Build container callbacks
  */
  "post /v0/build/:id/status/:token": "BuildController.status",
  "post /v0/build/:build_id/log/:token": "BuildLogController.create",
}
