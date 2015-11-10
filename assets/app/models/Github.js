var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var encodeB64 = require('../helpers/encoding').encodeB64;

var GithubModel = Backbone.Model.extend({
  initialize: function (opts) {
    var opts = opts || {},
        self = this;
    if (!opts.token) throw new Error('Must provide Github OAuth token');

    this.owner = opts.owner;
    this.name = opts.repoName;
    this.branch = opts.branch;
    this.token = opts.token;
    this.file = opts.file;
    this.site = opts.site;

    this.once('model:getConfig:success', function () {
      self.fetch();
    })

    this.checkForConfig();

    return this;
  },
  url: function (opts) {
    var self = this,
        opts = opts || {},
        ghUrl = 'https://api.github.com/repos',
        baseUrl   = [ghUrl, this.owner, this.name, 'contents'],
        qs = $.param({
          access_token: this.token,
          ref: this.branch,
          z: 6543
        });

    if (opts.root) return [baseUrl.join('/'), qs].join('?');

    if (opts.path) baseUrl.push(opts.path);
    else if (this.file) baseUrl.push(this.file);

    return [baseUrl.join('/'), qs].join('?');
  },
  parse: function (res) {
    var attrs = {
      json: res,
      type: 'directory'
    };

    if (res.type) attrs.type = res.type;

    return attrs;
  },
  commit: function (opts) {
    var self = this,
        data = {
          path: opts.path || this.file,
          message: opts.message,
          content: encodeB64(opts.content),
          branch: this.branch
        };

    if (this.attributes.json && this.attributes.json.sha) data.sha = this.attributes.json.sha;

    $.ajax(self.url({ path: data.path }), {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + self.token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data),
      complete: function (res) {
        var e = {
          request: data,
          response: res.status
        };

        if (res.status === 200 || res.status === 201) {
          self.attributes.json.sha = res.responseJSON.content.sha;
          self.trigger('model:save:success', e);
        }
        else {
          self.trigger('model:save:error', e);
        }
      }
    });
  },
  checkForConfig: function () {
    var self  = this,
        files = ['_navigation.json', '_defaults.yml'],
        bucketPath = /^http\:\/\/(.*)\.s3\-website\-(.*)\.amazonaws\.com/,
        siteRoot = (self.site) ? self.site.get('siteRoot') : '',
        match = siteRoot.match(bucketPath),
        bucket = match && match[1],
        root = bucket ? 'https://s3.amazonaws.com/' + bucket :
               siteRoot ? siteRoot : '';

    var getFiles = files.map(function(file) {
        var url = [
            root,
            'site',
            self.owner,
            self.name,
            file
          ].join('/');

      return function(callback) {
        $.ajax({
          url: url,
          complete: function(res) {
            var r = {
              file: file,
              present: (res.status === 200) ? true : false,
              json: res.responseJSON || []
            };
            callback(null, r);
          }
        });
      }
    });

    async.parallel(getFiles, function (err, results) {
      if (err) return self.trigger('model:getConfig:error');

      self.configFiles = {};

      results.forEach(function(r) {
        self.configFiles[r.file] = {
          present: r.present,
          json: r.json
        };
      });

      self.trigger('model:getConfig:success')
    });

    return this;
  },
  addPage: function (opts) {
    opts = opts || {};
    var commitOpts = {
      path: opts.path,
      message: opts.message || 'A new file at ' + opts.path,
      content: opts.content || this.configFiles['_defaults.yml'] || ''
    };
    this.commit(commitOpts);
  }
});

module.exports = GithubModel;
