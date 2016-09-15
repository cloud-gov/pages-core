import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes, navigationTypes } from '../constants';
import { encodeB64 } from '../util/encoding';
import convertFileToData from '../util/convertFileToData';
import store from '../store';
import alertActions from './alertActions';

import {
  sitesReceived as sitesReceivedActionCreator,
  siteAdded as siteAddedActionCreator,
  siteUpdated as siteUpdatedActionCreator,
  siteDeleted as siteDeletedActionCreator,
  siteFileContentReceived as siteFileContentReceivedActionCreator,
  siteAssetsReceived as siteAssetsReceivedActionCreator,
  siteFilesReceived as siteFilesReceivedActionCreator
} from "./actionCreators/siteActions";

import { updateRouter as updateRouterActionCreator } from "./actionCreators/navigationActions";


const alertError = error => {
  alertActions.httpError(error.message);
};

const updateRouterToSitesUri = () => {
  const action = updateRouterActionCreator(`/sites`);
  store.dispatch(action);
};

const updateRouterToSpecificSiteUri = siteId => {
  const action = updateRouterActionCreator(`/sites/${siteId}`);
  store.dispatch(action);
};

const dispatchSitesReceivedAction = sites => {
  const action = sitesReceivedActionCreator(sites);
  store.dispatch(action);
};

const dispatchSiteAddedAction = site => {
  const action = siteAddedActionCreator(site);
  store.dispatch(action);
};

const dispatchSiteUpdatedAction = site => {
  const action = siteUpdatedActionCreator(site);
  store.dispatch(action);
};

const dispatchSiteDeletedAction = siteId => {
  const action = siteDeletedActionCreator(siteId);
  store.dispatch(action);
};

const dispatchSiteFileContentReceivedAction = (siteId, fileContent) => {
  const action = siteFileContentReceivedActionCreator(siteId, fileContent);
  store.dispatch(action);
};

const dispatchSiteAssetsReceivedAction = (siteId, assets) => {
  const action = siteAssetsReceivedActionCreator(siteId, assets);
  store.dispatch(action);
};

const dispatchSiteFilesReceivedAction = (siteId, files) => {
  const action = siteFilesReceivedActionCreator(siteId, files);
  store.dispatch(action);
};


export default {
  fetchSites() {
    return federalist.fetchSites()
      .then(dispatchSitesReceivedAction)
      .catch(alertError);
  },

  addSite(siteToAdd) {
    return federalist.addSite(siteToAdd)
      .then(dispatchSiteAddedAction)
      .then(updateRouterToSitesUri)
      .catch(alertError);
  },

  updateSite(site, data) {
    return federalist.updateSite(site, data)
      .then(dispatchSiteUpdatedAction)
      .catch(alertError);
  },

  deleteSite(siteId) {
    return federalist.deleteSite(siteId)
      .then(dispatchSiteDeletedAction.bind(null, siteId))
      .then(updateRouterToSitesUri)
      .catch(alertError);
  },

  // todo rename to something like fetchTree
  fetchFiles(site, path) {
    return github.fetchRepositoryContent(site, path)
      .then(dispatchSiteFilesReceivedAction.bind(null, site.id))
      .catch(alertError);
  },

  fetchFileContent(site, path) {
    return github.fetchRepositoryContent(site, path)
      .then((file) => {
        dispatchSiteFileContentReceivedAction(site.id, file);
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
      branch: `${site.branch || site.defaultBranch}`
    };

    if (sha) commit = Object.assign({}, commit, { sha });

    return github.createCommit(site, path, commit).then((commitObj) => {
      alertActions.alertSuccess('File committed successfully');
      dispatchSiteFileContentReceivedAction(siteId, commitObj.content);
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
      dispatchSiteAssetsReceivedAction(site.id, assets);
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
      dispatchSiteFilesReceivedAction(site.id, files);

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
      dispatchSiteAddedAction(site);
      updateRouterToSpecificSiteUri(site.id);
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
