import http from 'axios';

import store from '../store';
import { encodeB64, decodeB64 } from './encoding';
import errorActions from '../actions/errorActions';

const API = 'https://api.github.com';

function getToken() {
  let state = store.getState();
  return state.user.passports[0].accessToken;
}

export default {
  fetch(url, params) {
    let u = `${API}/${url}`;
    return http.get(u, { params }).then((res) => {
      if (res.status === 200) return res.data;
;
      return Promise.reject(res.statusText);
    }).catch((err) => {
      errorActions.httpError(err);
    });
  },

  push(url, data, method = 'POST') {
    const u = `${API}/${url}`;
    const c = {
      url: u,
      method,
      data,
      headers: {
        'Authorization': 'token ' + getToken(),
        'Content-Type': 'application/json'
      }
    }
    http(c).then((res) => {
      console.log('res', res);
      return res;
    }).catch((err) => {
      errorActions.httpError(err);
    });
  },

  commitToRepository(site, path, commit) {
    let url = `repos/${site.owner}/${site.repository}/contents/${path}`;
    return this.push(url, commit, 'PUT');
  },

  createBranch(site, branch, sha) {
    const url = `/repos/${site.owner}/${site.repository}/git/refs`;
    const data = {
      ref: `refs/head/${branch}`,
      sha
    };
    return this.push(url, data);
  },

  createPullRequest(site, branch, base) {

  },

  deleteBranch(site, branch) {
    const url = `repos/${site.owner}/${site.repository}/git/refs/heads/${branch}`;
    return this.push(url, {}, 'DELETE');
  },

  fetchPullRequests(site) {
    const url = `repos/${site.owner}/${site.repository}/pulls`;
    return this.fetch(url);
  },

  fetchRepositoryConfigs(site) {
    const configFiles = ['_config.yml', '_navigation.json'];
    const configFetches = configFiles.map((path) => {
      return this.fetchRepositoryContent(site, path);
    });

    return Promise.all(configFetches).then((configs) => {
      return configs.map((c) => {
        return Object.assign({}, c, { content: decodeB64(c.content)});
      });
    }).then((configs) => {
      let result = {};
      configFiles.forEach((c, i) => {
        result[c] = configs[i];
      });
      return result;
    });
  },

  fetchRepositoryContent(site, path) {
    let url = `repos/${site.owner}/${site.repository}/contents/${path}`;
    let params = {
      access_token: getToken(),
      ref: site.branch
    };
    return this.fetch(url, params);
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
//   },
//   /*
//    * Clone a repository to the user's account.
//    * @param {Object} source - The source repo to clone.
//    * @param {string} source.owner - The source repo's owner.
//    * @param {string} source.repository - The source repo's name.
//    * @param {Object} destination - The destination repository.
//    * @param {string} destination.repository - The destination repo's name.
//    * @param {string} destination.organization - The destination repo's owner org (optional).
//    * @param {string} destination.branch - The destination repo's branch (optional).
//    * @param {string} destination.engine - The destination repo's build engine (optional).
//    * @param {function} done - The callback function.
//    */
//   clone: function clone(source, destination, done) {
//     var model = this;
//     var method = model.clone;
//     var err;
//
//     if (!source || !source.owner || !source.repository || !destination) {
//       err = new Error('Missing source or destination');
//       return done ? done(err) : err;
//     }
//
//     method.checkSource = function checkDestination(done) {
//       var url = model.url({
//         root: true, owner: source.owner, repository: source.repository
//       });
//
//       $.ajax({
//         dataType: 'json',
//         url: url,
//         success: done.bind(this, null),
//         error: done
//       });
//     };
//
//     method.createRepo = function createRepo(done) {
//       var route = destination.organization ?
//         'orgs/' + destination.organization : 'user';
//       var url = model.url({ route: route, method: 'repos' });
//       var data = { name: destination.repository };
//
//       $.ajax({
//         method: 'POST',
//         dataType: 'json',
//         contentType: 'application/json; charset=utf-8',
//         data: JSON.stringify(data),
//         url: url,
//         success: done.bind(this, null),
//         error: done
//       });
//
//     };
//
//     method.cloneRepo = function cloneRepo(done) {
//       var url = '/v0/site/clone';
//       var data = {
//         sourceOwner: source.owner,
//         sourceRepo: source.repository,
//         destinationOrg: destination.organization,
//         destinationRepo: destination.repository,
//         destinationBranch: destination.branch || this.branch,
//         engine: destination.engine || 'jekyll'
//       };
//       $.ajax({
//         method: 'POST',
//         dataType: 'json',
//         contentType: 'application/json; charset=utf-8',
//         data: JSON.stringify(data),
//         url: url,
//         success: done.bind(this, null),
//         error: done
//       });
//     };
//
//     if (done) async.series([
//       method.checkSource.bind(this),
//       method.createRepo.bind(this),
//       method.cloneRepo.bind(this)
//     ], done);
//
//     return this;
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
