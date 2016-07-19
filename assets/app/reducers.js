import {
  buildActionTypes,
  navigationTypes,
  iteActionTypes,
  siteActionTypes,
  userActionTypes,
  errorActionTypes
} from './constants';

export function assets(state = [], action) {
  switch (action.type) {
    case siteActionTypes.SITE_ASSETS_RECEIVED:
      let assets = action.assets.map((asset) => {
        return Object.assign({}, asset, { site: action.siteId });
      });
      let oldAssetUrls = state.map((asset) => {
        return asset.url;
      });
      let newAssets = assets.filter((asset) => {
        let url = asset.url;
        let hasNewUrl = (oldAssetUrls.indexOf(url) < 0) ? true : false;
        return hasNewUrl;
      })
      return [ ...state, ...newAssets ];
    default:
      return state;
  }
}

export function builds(state = [], action) {
  switch (action.type) {
    case buildActionTypes.BUILDS_RECEIVED:
      return action.builds;
    default:
      return state;
  }
}

export function sites(state = [], action) {
  switch (action.type) {
    case siteActionTypes.SITES_RECEIVED:
      return action.sites || []
    case siteActionTypes.SITE_ADDED:
      // if a site hasn't been properly added, return the existing state
      // TODO: why is this getting called if there is an error
      return action.site ? [...state, action.site] : state;
    case siteActionTypes.SITE_UPDATED:
      return state.map((site) => {
        if (site.id !== action.siteId) return site;

        return Object.assign({}, site, action.site);
      });
    case siteActionTypes.SITE_DELETED:
      return state.filter((site) => site.id != action.siteId);
    case siteActionTypes.SITE_CONFIGS_RECEIVED:
      return state.map((s) => {
        if (s.id !== action.siteId) return s;
        return Object.assign({}, s, action.configs);
      });
    case siteActionTypes.SITE_ASSETS_RECEIVED:
      return state.map((s) => {
        if (s.id !== action.siteId) return s;
        return Object.assign({}, s, { assets: action.assets });
      });
    case siteActionTypes.SITE_CONTENTS_RECEIVED:
      return state.map((s) => {
        if (s.id !== action.siteId) return s;
        return Object.assign({}, s, {
          files: action.files
        });
      });
    case siteActionTypes.SITE_CHILD_CONTENT_RECEIVED:
      const currentMap = state.childDirectoriesMap || {};
      const nextMap = {};
      nextMap[action.path] = action.files || [];

      return state.map((site) => {
        if (site.id !== action.siteId) return site;

        return Object.assign({}, site, {
          childDirectoriesMap: Object.assign({}, currentMap, nextMap)
        });
      });
    default:
      return state
  }
}

export function error(state = '', action) {
  switch (action.type) {
    case errorActionTypes.HTTP_ERROR:
      state = action.error;
      return state;
    default:
      return state;
  }
};

export function user(state = false, action) {
  switch (action.type) {
    case userActionTypes.USER_RECEIVED:
      return {
        id: action.user.id,
        username: action.user.username,
        email: action.user.email,
        passports: action.user.passports,
        createdAt: action.user.createdAt,
        updatedAt: action.user.updatedAt
      };
    default:
      return state
  }
}
