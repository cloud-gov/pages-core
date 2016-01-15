// Validation from https://github.com/rvagg/github-webhook-handler
// Copyright (c) 2014 Rod Vagg, MIT License

var crypto = require('crypto');

module.exports = {

  github: function(req, res) {
    var sig = req.headers['x-hub-signature'],
        event = req.headers['x-github-event'],
        id = req.headers['x-github-delivery'],
        secret = sails.config.webhook.secret,
        payload = req.body;

    // Ignore non-push events
    if (event !== 'push') return res.ok();

    // Validate headers
    if (!sig) return res.badRequest('No X-Hub-Signature found on request');
    if (!event) return res.badRequest('No X-Github-Event found on request');
    if (!id) return res.badRequest('No X-Github-Delivery found on request');

    // Validate secret signature
    if (sig !== signBlob(secret, JSON.stringify(payload))) {
      return res.badRequest('X-Hub-Signature does not match blob signature');
    }

    // Send OK status to webhook
    res.ok();

    // Ignore empty commits and deleted branches
    if (!payload.commits || !payload.commits.length) return;

    // Log request payload (only if verbose logging is enabled)
    sails.log.verbose('Received GitHub webhook payload: ', payload);

    // Set up a new build model
    async.parallel({

      // Find a matching user
      user: function(next) {
        var record = { username: payload.sender.login };
        User.findOrCreate(record, record, next);
      },

      // Find a matching site
      site: function(next) {
        Site.findOne({
          owner: payload.repository.full_name.split('/')[0],
          repository: payload.repository.full_name.split('/')[1]
        }, next);
      }

    }, function(err, data) {

      // Abort if no matching user or site found
      if (err) return sails.log.warn('Unable to set up build: ', err);

      // Set branch
      data.branch = payload.ref.replace('refs/heads/', '');

      // Create a new build
      Build.create(data, function(err) {
        if (err) return sails.log.warn('Unable to create build: ', err);
      });

    });

  }

};

function signBlob (key, blob) {
  return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
}
