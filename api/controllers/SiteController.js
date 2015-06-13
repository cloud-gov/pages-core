/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  forkSiteFromTemplate: function forkSiteFromTemplate(req, res) {
    return GitHub.forkRepository(req, res);
  }
};
