const logger = require("winston")
const S3Proxy = require("../services/S3Proxy")

module.exports = {
  proxy: function(req, res) {
    S3Proxy.proxy(req, res).catch(err => {
      if (!req.authenticated && err.status === 403) {
        req.session.authRedirectPath = req.path
        req.session.save(() => res.redirect("/auth/github"))
      } else {
        logger.error("Unhandled S3Proxy error: ", err)
        res.redirect('/?error=preview.login')
      }
    })
  }
}
