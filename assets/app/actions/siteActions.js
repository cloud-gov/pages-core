import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes, navigationTypes } from '../constants';
import { encodeB64 } from '../util/encoding';
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


  createCommit(site, path, fileData, message = false, sha = false) {
    const b64EncodedFileContents = encodeB64(fileData);
    const siteId = site.id;
    let commit = {
      message: (message) ? message : `Adds ${path} to project`,
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

      store.dispatch({
        type: navigationTypes.UPDATE_ROUTER,
        method: 'push',
        arguments: [`/sites/${siteId}`]
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
            type: siteActionTypes.SITE_CONTENTS_RECEIVED,
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
  fetchContent(site, path) {
    function dispatchChildContent(site, path, files) {
      store.dispatch({
        type: siteActionTypes.SITE_CHILD_CONTENT_RECEIVED,
        siteId: 1,
        path,
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
  }
}

function throwRuntime(error) {
  const runtimeErrors = ['TypeError'];
  const isRuntimeError = runtimeErrors.find((e) => e === error.name);
  if (isRuntimeError) {
    throw error;
  }
}
