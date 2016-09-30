import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import convertFileToData from '../util/convertFileToData';
import alertActions from './alertActions';
import { addPathToSite, uploadFileToSite } from "../util/makeCommitData";
import { formatDraftBranchName } from "../util/branchFormatter";
import findShaForDefaultBranch from "../util/findShaForDefaultBranch";
import filterAssetsWithTypeOfFile from "../util/filterAssetsWithTypeOfFile";

import {
  updateRouterToSitesUri,
  updateRouterToSpecificSiteUri,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteFileContentReceivedAction,
  dispatchSiteAssetsReceivedAction,
  dispatchSiteFilesReceivedAction,
  dispatchSiteConfigsReceivedAction,
  dispatchSiteBranchesReceivedAction
} from "./dispatchActions";


const alertError = error => {
  alertActions.httpError(error.message);
};

const uploadFileAsCommit = (site, filename, fileData, sha) => {
  const path = `assets/${filename}`;
  const commit = uploadFileToSite(filename, fileData, sha);
  return github.createCommit(site, path, commit);
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
      .then(dispatchSiteFileContentReceivedAction.bind(null, site.id));
  },

  fetchSiteConfigs(site) {
    return github.fetchRepositoryConfigs(site)
      .then(dispatchSiteConfigsReceivedAction.bind(null, site.id))
      .then(() => site);
  },

  createCommit(site, path, fileData, message = false, sha = false) {
    const commit = addPathToSite(site, path, fileData, message, sha);

    return github.createCommit(site, path, commit).then((commitObj) => {
      alertActions.alertSuccess('File committed successfully');
      dispatchSiteFileContentReceivedAction(site.id, commitObj.content);
    }).catch(alertError);
  },

  fetchSiteAssets(site) {
    const config = site['_config.yml'];
    const assetPath = (config && config.assetPath) || 'assets';

    return github.fetchRepositoryContent(site, assetPath)
      .then(filterAssetsWithTypeOfFile)
      .then(dispatchSiteAssetsReceivedAction.bind(null, site.id))
      .then(() => Promise.resolve(site))
      .catch(alertError);
  },

  fetchBranches(site) {
    return github.fetchBranches(site)
      .then(dispatchSiteBranchesReceivedAction.bind(null, site.id))
      .then(() => site);
  },

  deleteBranch(site, branch) {
    return github.deleteBranch(site, branch).then(() => {
      return this.fetchBranches(site);
    }).catch(alertError);
  },

  cloneRepo(destination, source) {
    return github.createRepo(destination, source).then(() => {
      return federalist.cloneRepo(destination, source);
    }).then((site) => {
      dispatchSiteAddedAction(site);
      updateRouterToSpecificSiteUri(site.id);
    }).catch(alertError);
  },

  createDraftBranch(site, path) {
    const branchName = formatDraftBranchName(path);
    const sha = findShaForDefaultBranch(site);

    return github.createBranch(site, branchName, sha).then(() => {
      // Update the site object with new branches from github
      this.fetchBranches(site);
      return branchName;
    });
  },

  uploadFile(site, file, sha = false) {
    const siteId = site.id;
    const { name } = file;

    return convertFileToData(file).then((fileData) => {
      return uploadFileAsCommit(site, name, fileData, sha);
    }).then(() => {
      alertActions.alertSuccess('File uploaded successfully');
      this.fetchSiteAssets(site);
    }).catch(error => alertActions.alertError(error.message));
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
      throwRuntime(error);
      alertActions.httpError(error.message);
    });
  }
};

function throwRuntime(error) {
  const runtimeErrors = ['TypeError'];
  const isRuntimeError = runtimeErrors.find((e) => e === error.name);
  if (isRuntimeError) {
    throw error;
  }
}
