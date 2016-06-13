import { buildActionTypes, siteActionTypes, userActionTypes, viewActionTypes, viewTypes } from './constants';

const initialCurrentViewState = {
  id: viewTypes.HOME,
  siteId: 0
}

export function currentView(state = initialCurrentViewState, action) {
  switch (action.type) {
    case viewActionTypes.CURRENT_VIEW_SET:
      return {
        id: action.view,
        siteId: action.siteId
      }
    default:
      return state
  }
}

export function builds(state = [], action) {
  switch (action.type) {
    case buildActionTypes.BUILDS_RECEIVED:
      return action.builds
    default:
      return state
  }
}

export function sites(state = [], action) {
  switch (action.type) {
    case siteActionTypes.SITES_RECEIVED:
      return action.sites
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
    default:
      return state
  }
}

export function user(state = false, action) {
  switch (action.type) {
    case userActionTypes.USER_RECEIVED:
      return Object.assign({}, action.user, {
        passports: [
          {
            accessToken: 'd2995e2edfdd97b4039aa58fcfb9468eda781c26'
          }
        ]
      });
    default:
      return state
  }
}
