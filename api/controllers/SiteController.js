/**
 * SiteController
 *
 * @description :: Server-side logic for managing sites
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  clone: function cloneSite(req, res) {
    var data = {
      owner: req.param('destinationOrg') || req.user.username,
      repository: req.param('destinationRepo'),
      defaultBranch: req.param('destinationBranch'),
      engine: req.param('engine'),
      users: [req.user.id]
    };
    Site.create(data).exec(function(err, site) {
      if (err) return res.serverError(err);
      var build = {
        user: req.user.id,
        site: site.id,
        branch: site.defaultBranch,
        source: {
          repository: req.param('sourceRepo'),
          owner: req.param('sourceOwner')
        }
      };

      Site.findOne({
        id: site.id
      }).populate('builds').populate("users").exec(function(err, site) {
        if (err) return res.serverError(err);

        // Delete the build that runs automatically when the site is created
        Build.destroy({ id: site.builds[0].id }).exec(function(err) {
          sails.log.info('build destroyed');
          if (err) return res.serverError(err);
        });

        // Create build with clone repo
        Build.create(build, function(err, model) {
          if (err) return res.serverError(err);
          res.send(site);
        });
      });
    });
  }

};
