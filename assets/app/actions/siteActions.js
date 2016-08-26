import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes, navigationTypes } from '../constants';
import { encodeB64 } from '../util/encoding';
import convertFileToData from '../util/convertFileToData';
import store from '../store';
import alertActions from './alertActions';

export default {
  fetchSites() {
    federalist.fetchSites().then((sites) => {
      store.dispatch({
        type: siteActionTypes.SITES_RECEIVED,
        sites
      });
    }).catch(error => alertActions.httpError(error.message));
  },

  addSite(siteToAdd) {
    federalist.addSite(siteToAdd).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_ADDED,
        site
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      });
    }).catch(error => alertActions.httpError(error.message));
  },

  updateSite(site, data) {
    federalist.updateSite(site, data).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_UPDATED,
        siteId: site.id,
        site
      })
    }).catch(error => alertActions.httpError(error.message));
  },

  deleteSite(siteId) {
    federalist.deleteSite(siteId).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_DELETED,
        siteId
      });

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites`]
      });
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

  createCommit(site, path, fileData, message = false, sha = false) {
    const b64EncodedFileContents = encodeB64(fileData);
    const siteId = site.id;
    let commit = {
      message: message ? message : `Adds ${path} to project`,
      content: b64EncodedFileContents
    };

    if (sha) commit = Object.assign({}, commit, { sha });

    github.createCommit(site, path, commit).then((commitObj) => {
      alertActions.alertSuccess('File added successfully');

      store.dispatch({
        type: siteActionTypes.SITE_FILE_ADDED,
        siteId,
        file: commitObj.content
      });
    }).catch(error => alertActions.httpError(error.message));
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
    }).catch(error => alertActions.httpError(error.message));
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

  fetchSiteConfigsAndAssets(site) {
    return this.fetchSiteConfigs(site).then((site) => {
      return this.fetchSiteAssets(site).then((site) => {
        return github.fetchRepositoryContent(site).then((files) => {
          store.dispatch({
            type: siteActionTypes.SITE_FILES_RECEIVED,
            siteId: site.id,
            files
          });

          return files;
        });
      });
    }).catch((error) => {
      // TODO: make a generic catch handler that will only
      // trigger an http error action for an actual http
      // error.
      throwRuntime(throwRuntime);
      alertActions.httpError(error.message)
    });
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
      ).catch(error => alertActions.httpError(error.message));
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
    }).catch((error) => alertActions.httpError(error.message));
  },

  getBranches(site) {
    return github.fetchBranches(site).then((branches) => {

      store.dispatch({
        type: siteActionTypes.SITE_BRANCHES_RECEIVED,
        siteId: site.id,
        branches
      });
    });
  }
}

function throwRuntime(error) {
  const runtimeErrors = ['TypeError'];
  const isRuntimeError = runtimeErrors.find((e) => e === error.name);
  if (isRuntimeError) {
    throw error;
  }
}
