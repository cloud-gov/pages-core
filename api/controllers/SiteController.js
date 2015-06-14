/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  fork: function forkSiteFromTemplate(req, res) {
    var user = req.user,
        templateId = req.param('templateId');
    GitHub.forkRepository(user, templateId, function(err, newSite) {
      if (err) return res.serverError(err);
      res.send(newSite);
    });
  }

};
