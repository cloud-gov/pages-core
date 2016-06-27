import {
  buildActionTypes,
  navigationTypes,
  iteActionTypes,
  siteActionTypes,
  userActionTypes
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

export function navigation(state = {}, action) {
  switch (action.type) {
    case navigationTypes.ROUTE_CHANGED:
      if (!action.location.options.id) return action.location;

      return Object.assign({}, action.location, {
        options: {
          id: +action.location.options.id
        }
      });
    default:
      return state;
  }
}

export function sites(state = [], action) {
  switch (action.type) {
    case siteActionTypes.SITES_RECEIVED:
      return action.sites || []
    case siteActionTypes.SITE_ADDED:
      return [...state, action.site];
    case siteActionTypes.SITE_DELETED:
      return state.filter((s) => s.id !== action.siteId);
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
    default:
      return state
  }
}

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
