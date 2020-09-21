import {
  sitesFetchStartedType as SITES_FETCH_STARTED,
  sitesReceivedType as SITES_RECEIVED,
  siteAddedType as SITE_ADDED,
  siteUpdatedType as SITE_UPDATED,
  siteDeletedType as SITE_DELETED,
  siteBranchesReceivedType as SITE_BRANCHES_RECEIVED,
  siteUserAddedType as SITE_USER_ADDED,
  siteUserRemovedType as SITE_USER_REMOVED,
  siteUserUpdatedType as SITE_USER_UPDATED,
  siteBasicAuthSavedType as SITE_BASIC_AUTH_SAVED,
  siteBasicAuthRemovedType as SITE_BASIC_AUTH_REMOVED,
} from '../actions/actionCreators/siteActions';

import {
  httpErrorType as HTTP_ERROR,
} from '../actions/actionCreators/alertActions';

const initialState = {
  isLoading: false,
  data: [],
};

const mapPropertyToMatchingSite = (data, siteId, properties) => data.map((site) => {
  if (site.id !== siteId) return site;
  return { ...site, ...properties };
});

export default function sites(state = initialState, action) {
  switch (action.type) {
    case HTTP_ERROR:
      return { ...state, isLoading: false };

    case SITES_FETCH_STARTED:
      return { ...state, isLoading: true };

    case SITES_RECEIVED: {
      const nextSites = action.sites || state.data;
      return {
        ...state,
        isLoading: false,
        data: nextSites,
      };
    }

    case SITE_ADDED:
      return { ...state, isLoading: false, data: state.data.concat(action.site || []) };

    case SITE_UPDATED:
    case SITE_USER_UPDATED:
    case SITE_BASIC_AUTH_REMOVED:
    case SITE_BASIC_AUTH_SAVED:
      return {
        isLoading: false,
        data: mapPropertyToMatchingSite(state.data, action.siteId, action.site),
      };

    case SITE_BRANCHES_RECEIVED:
      return {
        isLoading: false,
        data: mapPropertyToMatchingSite(state.data, action.siteId, { branches: action.branches }),
      };

    case SITE_DELETED:
      return {
        isLoading: false,
        data: state.data.filter(site => site.id !== action.siteId),
      };

    case SITE_USER_ADDED:
      return action.site ? {
        isLoading: false,
        data: state.data.concat(action.site),
      } : state;

    case SITE_USER_REMOVED: {
      return {
        isLoading: false,
        data: [
          action.site,
          ...state.data.filter(site => site.id !== action.site.id),
        ],
      };
    }

    default:
      return state;
  }
}
