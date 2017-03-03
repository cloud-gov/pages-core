const S3Proxy = require("../services/S3Proxy")

module.exports = {
  proxy: function(req, res) {
    S3Proxy.proxy(req, res).catch(err => {
      sails.log.error(err)
      res.redirect('/?error=preview.login')
    })
  }
}
