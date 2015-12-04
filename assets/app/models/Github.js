var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var encodeB64 = require('../helpers/encoding').encodeB64;

var GithubModel = Backbone.Model.extend({
  initialize: function (opts) {
    var opts = opts || {};
    if (!opts.token) throw new Error('Must provide Github OAuth token');

    this.owner = opts.owner;
    this.name = opts.repoName;
    this.branch = opts.branch;
    this.token = opts.token;
    this.file = opts.file;
    this.site = opts.site;
    this.assets = [];
    this.uploadDir = opts.uploadRoot || 'uploads';

    this.once('github:fetchConfig:success', function () {
      this.fetchAssets();
      this.fetch();
    }.bind(this));

    this.fetchConfig();

    return this;
  },
  url: function (opts) {
    var opts = opts || {},
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
          content: opts.base64 || encodeB64(opts.content),
          branch: this.branch
        };

    if (this.attributes.json && this.attributes.json.sha) {
      data.sha = this.attributes.json.sha;
    }

    $.ajax(this.url({ path: data.path }), {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + this.token,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data),
      complete: function (res) {
        var e = { request: data, response: res.status };

        if (res.status !== 200 || res.status !== 201) {
          self.trigger('github:commit:error', e);
          return;
        }

        self.attributes.json.sha = res.responseJSON.content.sha;

        // if this is an uploaded asset
        if (data.path.match(self.uploadDir)) {
          // refresh internal store of assets
          self.fetchAssets.call(self);
          window.federalist.dispatcher.trigger('github:upload:success', res.responseJSON);
        } else {
          self.trigger('github:commit:success', e);
        }

      }
    });
  },
  fetchConfig: function () {
    var self  = this,
        files = ['_navigation.json', '_defaults.yml'],
        bucketPath = /^http\:\/\/(.*)\.s3\-website\-(.*)\.amazonaws\.com/,
        siteRoot = (this.site) ? this.site.get('siteRoot') : '',
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
      if (err) return self.trigger('github:fetchConfig:error');

      self.configFiles = {};

      results.forEach(function(r) {
        self.configFiles[r.file] = {
          present: r.present,
          json: r.json
        };
      });

      self.trigger('github:fetchConfig:success')
    });

    return this;
  },
  fetchAssets: function () {
    var self = this;

    $.ajax({
      url: this.url({ path: 'uploads' }),
      method: 'GET',
      complete: function (res) {
        if (res.status === 200) {
          self.assets = res.responseJSON;
          self.trigger('github:fetchAssets:success', self.assets);
        }
        else {
          self.trigger('github:fetchAssets:error', res.status);
        }
      }
    });
  },
  filterAssets: function (type) {
    var regexByType = {
      'images': /\.jpg|\.jpeg|\.png|\.gif/,
      'documents': /\.doc|\.docx|\.pdf/
    };

    if (type === 'image') type = 'images';

    return this.assets.filter(function(a) {
      var isOfType = a.name.match(regexByType[type]);
      return isOfType;
    });
  },
  addPage: function (opts) {
    opts = opts || {};
    var content = (this.configFiles['_defaults.yml'].present) ? this.configFiles['_defaults.yml'].json : '\n';
    var commitOpts = {
      path: opts.path,
      message: opts.message || 'The file ' + opts.path + ' was created',
      content: opts.content || content
    };
    this.commit(commitOpts);
  }
});

module.exports = GithubModel;
