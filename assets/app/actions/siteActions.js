import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import { siteActionTypes } from '../constants';
import store from '../store';
import { httpError } from './errorActions';

export default {
  fetchSites() {
    federalist.fetchSites().then((sites) => {
      store.dispatch({
        type: siteActionTypes.SITES_RECEIVED,
        sites
      });
    });
  },

  addSite(siteToAdd) {
    federalist.addSite(siteToAdd).then((site) => {
      store.dispatch({
        type: siteActionTypes.SITE_ADDED,
        site
      });
    });
  },

  deleteSite(siteId) {
    federalist.deleteSite(siteId);
  },

  deletedSite(siteId) {
    store.dispatch({
      type: siteActionTypes.SITE_DELETED,
      siteId
    });
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
    });
  },

  fetchSiteConfigs(site) {
    return github.fetchRepositoryConfigs(site).then((configs) => {
      store.dispatch({
        type: siteActionTypes.SITE_CONFIGS_RECEIVED,
        siteId: site.id,
        configs
      });

      return Promise.resolve(site);
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
        });
      });
    });
  },

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
      ).catch(err => httpError(err));
  }

}
