
import fetch from './fetch';

import store from '../store';
import { encodeB64, decodeB64 } from './encoding';
import alertActions from '../actions/alertActions';

const API = 'https://api.github.com';

function getToken() {
  const state = store.getState();
  const passports = state.user.passports;
  let github = passports.filter((passport) => {
    return passport.provider === 'github';
  }).pop();

  return github.tokens.accessToken;
}

function getRepoFor(site) {
  return `repos/${site.owner}/${site.repository}`;
}

const github = {
  fetch(path, params) {
    const url = `${API}/${path}`;

    return fetch(url, params).then((data) => {
      return data;
    });
  },

  createCommit(site, path, commit) {
    let url = `${getRepoFor(site)}/contents/${path}`;

    return this.fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${getToken()}`
      },
      data: commit
    });
  },

  createBranch(site, branch, sha) {
    const url = `${getRepoFor(site)}/git/refs`;
    const data = {
      ref: `refs/head/${branch}`,
      sha
    };

    return this.fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${getToken()}`
      },
      data
    });
  },

  createPullRequest(site, branch, base) {

  },

  deleteBranch(site, branch) {
    const url = `${getRepoFor(site)}/git/refs/heads/${branch}`;
    return this.fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${getToken()}`
      }
    });
  },

  fetchPullRequests(site) {
    const url = `${getRepoFor(site)}/pulls`;
    return this.fetch(url);
  },

  fetchRepositoryConfigs(site) {
    const configFiles = ['_config.yml', '_navigation.json'];

    const configFetches = configFiles.map((path) => {
      return this.fetchRepositoryContent(site, path);
    });

    return Promise.all(configFetches).then((configs) => {
      return configs.map((config) => {
        const content = (config) ? decodeB64(config.content) : false
        return Object.assign({}, config, { content });
      });
    }).then((configs) => {
      return configFiles.reduce((result, configFile, index) => {
        result[configFile] = configs[index]
        return result;
      }, {});
    });
  },

  fetchRepositoryContent(site, path = '') {
    const url = `repos/${site.owner}/${site.repository}/contents/${path}`;
    const params = {
      access_token: getToken(),
      ref: site.branch || site.defaultBranch
    };

    return this.fetch(url, { params });
  },

  /**
   * creates a new github repo at the user's account
   * @param  {Object} destination Repo to be created
   *                              keys:
   *                              	repo: String:required
   *                              	organization: String (default to 'user')
   *                              	branch: String (default to 'master')
   *                              	engine: String (default to 'jekyll')
   *
   * }
   * @param  {Object} source      Repo to be cloned
   *                              keys:
   *                              	owner: String:required
   *                              	repo: String:required
   * @return {Promise}
   */
  createRepo(destination, source) {
    const token = getToken();
    /**
     * Issue an OPTIONS request to determine if the source repository to be
     * cloned exists on github.
     * @param  {String} owner Github username associated with the repo
     * @param  {String} repo  Name of the repository to be cloned
     * @return {Promise}
     */
    function checkSourceRepo(owner, repo) {
      const params = {
        access_token: token
      };
      const sourceUrl = `repos/${owner}/${repo}`;

      return github.fetch(sourceUrl, { params });
    }

    /**
     * Issue a POST request to github to create a new repository for the user
     * @param  {Object} destination keys:
     *                              	repo:String required
     *                              	organization:String
     * @return {Promise}
     */
    function createRepo(destination) {
      const org = destination.organization ?
        `orgs/${destination.organization}` : 'user';

      const repoUrl = `${org}/repos`;

      return github.fetch(repoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`
        },
        data: {
          name: destination.repo
        }
      });
    }

    return checkSourceRepo(source.owner, source.repo)
      .then(() => createRepo(destination));
  }
}

// var GithubModel = Backbone.Model.extend({
//   initialize: function (opts) {
//     opts = opts || {};
//     if (!opts.token) throw new Error('Must provide Github OAuth token');
//
//     this.owner = opts.owner;
//     this.name = opts.repoName;
//     this.branch = opts.branch;
//     this.token = opts.token;
//     this.file = opts.file;
//     this.site = opts.site;
//     this.assets = [];
//     this.uploadDir = opts.uploadRoot || 'uploads';
//
//     this.once('github:fetchConfig:success', function () {
//       this.fetchDrafts();
//     }.bind(this));
//
//     this.once('github:fetchDrafts:success', function () {
//       this.fetchAssets();
//       this.fetch();
//     }.bind(this));
//
//     this.fetchConfig();
//
//     return this;
//   },
//   formatDraftBranchName: function (filename) {
//     var branchName = '_draft-' + encodeB64(filename);
//
//     return branchName;
//   },
//   createPR: function(done) {
//     var url = this.url({ root: true, path: 'pulls' });
//
//     $.ajax({
//       method: 'POST',
//       dataType: 'json',
//       contentType: 'application/json; charset=utf-8',
//       url: url,
//       data: JSON.stringify({
//         title: 'Draft updates for ' + this.get('file'),
//         body: '',
//         head: this.get('branch'),
//         base: this.get('defaultBranch')
//       }),
//       success: function(res) {
//         done(null, res);
//       }.bind(this),
//       error: done
//     });
//
//   },
//   getPR: function(done) {
//     var url = this.url({
//       root: true,
//       path: 'pulls',
//       params: {
//         per_page: 100
//       }
//     });
//
//     $.ajax({
//       url: url,
//       data: {
//         head: this.get('branch')
//       },
//       success: function(res) {
//         this.set('pr', res[0].number);
//         done(null, res);
//       }.bind(this),
//       error: done
//     });
//
//   },
//   save: function(opts, done) {
//     done = done || _.noop;
//
//     // if on a branch, pass through to commit
//     if (this.get('branch') !== this.get('defaultBranch')) {
//       return this.commit(opts, done);
//     }
//
//     async.series([
//       this.createDraftBranch.bind(this),
//       this.commit.bind(this, opts),
//       this.createPR.bind(this)
//     ], done);
//
//   },
//   publish: function(opts, done) {
//     async.series([
//       this.save.bind(this, opts),
//       this.getPR.bind(this),
//       this.mergePR.bind(this),
//       this.deleteBranch.bind(this)
//     ], done);
//   },
//   mergePR: function(done) {
//     if (!this.get('pr')) return done('PR not available');
//
//     var url = this.url({
//       root: true,
//       path: 'pulls/' + this.get('pr') + '/merge'
//     });
//
//     $.ajax({
//       method: 'PUT',
//       dataType: 'json',
//       contentType: 'application/json; charset=utf-8',
//       data: JSON.stringify({
//         commit_message: 'Merged via Federalist'
//       }),
//       url: url,
//       success: function(res) {
//         this.set('pr', undefined);
//         done(null, res);
//       }.bind(this),
//       error: done
//     });
//
//   },
//   fetchDrafts: function() {
//     var self = this;
//     var url = this.url({
//       root: true,
//       path: 'branches',
//       params: {
//         per_page: 100
//       }
//     });
//     $.ajax({
//       url: url,
//       success: function(data) {
//         var drafts = _(data).chain().filter(function(branch) {
//           return branch.name && branch.name.indexOf('_draft-') === 0;
//         }).map(function(branch) {
//           return decodeB64(branch.name.replace('_draft-', ''));
//         }).compact().value();
//         if (!self.site) return;
//         var defaultSHA = _.findWhere(data, {
//           name: self.site.get('defaultBranch')
//         }).commit.sha;
//         self.set('drafts', drafts);
//         self.set('defaultSHA', defaultSHA);
//         self.trigger('github:fetchDrafts:success');
//       },
//       error: function(res) {
//         self.trigger('github:fetchDrafts:error', res.status);
//       }
//     });
//   },
//   getDefaults: function () {
//     var config = this.configFiles['_config.yml'],
//         hasDefaults = config.present && config.json && config.json.defaults,
//         defaultConfigs = (hasDefaults) ? config.json.defaults : [],
//         defaults = defaultConfigs.filter(function (c) {
//           return c.scope.path === "";
//         }),
//         d = (defaults.length > 0) ? yaml.dump(defaults[0].values) : '\n';
//
//     return d;
//   },
//   getLayouts: function () {
//     var defaultString = this.getDefaults(),
//         defaults = yaml.parse(defaultString) || '',
//         layouts = defaults.layout || ['default'];
//
//     return layouts;
//   }
// });
//
// module.exports = GithubModel;
//
export default github;
