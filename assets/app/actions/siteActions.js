import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes, navigationTypes } from '../constants';
import { encodeB64 } from '../util/encoding';
import convertFileToData from '../util/convertFileToData';
import store from '../store';
import alertActions from './alertActions';

const alertError = error => {
  alertActions.httpError(error.message);
};

const updateRouterToSitesUri = () => {
  store.dispatch({
    type: navigationTypes.UPDATE_ROUTER,
    method: 'push',
    arguments: [`/sites`]
  });
};

export default {
  fetchSites() {
    return federalist.fetchSites().then((sites) => {
      store.dispatch({
        type: siteActionTypes.SITES_RECEIVED,
        sites
      });
    }).catch(alertError);
  },

  addSite(siteToAdd) {
    return federalist.addSite(siteToAdd).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_ADDED,
        site
      });

      updateRouterToSitesUri();
    }).catch(alertError);
  },

  updateSite(site, data) {
    return federalist.updateSite(site, data).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_UPDATED,
        siteId: site.id,
        site
      });
    }).catch(alertError);
  },

  deleteSite(siteId) {
    return federalist.deleteSite(siteId).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_DELETED,
        siteId
      });

      updateRouterToSitesUri();
    }).catch(alertError);
  },

  // todo rename to something like fetchTree
  fetchFiles(site, path) {
    function dispatchChildContent(site, path, files) {
      store.dispatch({
        type: siteActionTypes.SITE_FILES_RECEIVED,
        siteId: site.id,
        files
      });
    }

    return github.fetchRepositoryContent(site, path)
      .then(
        dispatchChildContent.bind(null, site, path)
      ).catch(alertError);
  },

  fetchFileContent(site, path) {
    return github.fetchRepositoryContent(site, path)
      .then((file) => {
        store.dispatch({
          type: siteActionTypes.SITE_FILE_CONTENT_RECEIVED,
          siteId: site.id,
          file
        });
      });
  },

  fetchSiteConfigs(site) {
    return github.fetchRepositoryConfigs(site).then((configs) => {
      store.dispatch({
        type: siteActionTypes.SITE_CONFIGS_RECEIVED,
        siteId: site.id,
        configs
      });
      
      return site;
    });
  },

  createCommit(site, path, fileData, message = false, sha = false) {
    const b64EncodedFileContents = encodeB64(fileData);
    const siteId = site.id;
    let commit = {
      path,
      message: (message) ? message : `Adds ${path} to project`,
      content: b64EncodedFileContents,
      branch: `${site.branch || site.defaultBranch}`,
    };

    if (sha) commit = Object.assign({}, commit, { sha });

    return github.createCommit(site, path, commit).then((commitObj) => {
      alertActions.alertSuccess('File committed successfully');

      store.dispatch({
        type: siteActionTypes.SITE_FILE_CONTENT_RECEIVED,
        siteId,
        file: commitObj.content
      });
    }).catch(alertError);
  },

  fetchSiteAssets(site) {
    const config = site['_config.yml'];
    const assetPath = (config && config.assetPath) || 'assets';

    return github.fetchRepositoryContent(site, assetPath).then((assets) => {
      return assets.filter((asset) => {
        return asset.type === 'file';
      });
    }).then((assets) => {
      store.dispatch({
        type: siteActionTypes.SITE_ASSETS_RECEIVED,
        siteId: site.id,
        assets
      });
      return Promise.resolve(site);
    }).catch(alertError);
  },

  createPR(site, head, base) {
    return github.createPullRequest(site, head, base).then((pr) => {
      return github.mergePullRequest(site, pr);
    }).then(() => {
      return github.deleteBranch(site, head);
    }).then(() => {
      this.fetchBranches(site);
    }).then(() => {
      return alertActions.alertSuccess(`${head} merged successfully`);
    }).catch(error => alertActions.httpError(error.message));
  },

  uploadFile(site, file, sha = false) {
    const siteId = site.id;
    const { name } = file;

    convertFileToData(file).then((fileData) => {
      const path = `assets/${name}`;
      const message = `Uploads ${name} to project`;
      let commit = {
        content: fileData,
        message: message
      };

      if (sha) commit = Object.assign({}, commit, { sha });

      return github.createCommit(site, path, commit);
    }).then((commitObj) => {
        alertActions.alertSuccess('File uploaded successfully');
        this.fetchSiteAssets(site);
    }).catch(error => alertActions.alertError(error.message));
  },

  fetchSiteConfigsAndAssets(site) {
    return this.fetchSiteConfigs(site).then((site) => {
      return this.fetchBranches(site);
    }).then((site) => {
      return this.fetchSiteAssets(site);
    }).then((site) => {
      return github.fetchRepositoryContent(site);
    }).then((files) => {
      store.dispatch({
        type: siteActionTypes.SITE_FILES_RECEIVED,
        siteId: site.id,
        files
      });

      return files;
    }).catch((error) => {
      // TODO: make a generic catch handler that will only
      // trigger an http error action for an actual http
      // error.
      throwRuntime(throwRuntime);
      alertActions.httpError(error.message);
    });
  },

  cloneRepo(destination, source) {
    return github.createRepo(destination, source).then(() => {
      return federalist.cloneRepo(destination, source);
    }).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_ADDED,
        site
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites/${site.id}`]
      });
    }).catch(alertError);
  },

  fetchBranches(site) {
    return github.fetchBranches(site).then((branches) => {

      store.dispatch({
        type: siteActionTypes.SITE_BRANCHES_RECEIVED,
        siteId: site.id,
        branches
      });

      return site;
    });
  },

  createDraftBranch(site, path) {
    const branchName = `_draft-${encodeB64(path)}`;
    const sha = site.branches.find((branch) => {
      return branch.name === site.defaultBranch;
    }).commit.sha;

    return github.createBranch(site, branchName, sha).then(() => {
      // Update the site object with new branches from github
      this.fetchBranches(site);
      return branchName;
    });
  },

  deleteBranch(site, branch) {
    return github.deleteBranch(site, branch).then(() => {
      return this.fetchBranches(site);
    }).catch(alertError);
  }
};

function throwRuntime(error) {
  const runtimeErrors = ['TypeError'];
  const isRuntimeError = runtimeErrors.find((e) => e === error.name);
  if (isRuntimeError) {
    throw error;
  }
}
