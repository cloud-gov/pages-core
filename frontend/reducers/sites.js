import {
  sitesFetchStartedType as SITES_FETCH_STARTED,
  sitesReceivedType as SITES_RECEIVED,
  siteAddedType as SITE_ADDED,
  siteUpdatedType as SITE_UPDATED,
  siteDeletedType as SITE_DELETED,
  siteBranchesReceivedType as SITE_BRANCHES_RECEIVED,
  siteUserAddedType as SITE_USER_ADDED,
  siteUserRemovedType as SITE_USER_REMOVED,
  setCurrentSiteType as SET_CURRENT_SITE,
} from '../actions/actionCreators/siteActions';

const initialState = {
  isLoading: false,
  currentSite: null,
  data: [],
};

const mapPropertyToMatchingSite = (data, siteId, properties) => data.map((site) => {
  if (site.id !== siteId) return site;
  return Object.assign({}, site, properties);
});

export default function sites(state = initialState, action) {
  switch (action.type) {
    case SITES_FETCH_STARTED:
      return { ...state, isLoading: true };

    case SITES_RECEIVED: {
      let currentSite = null;
      const nextSites = action.sites || state.data;
      if (state.currentSite) {
        currentSite = nextSites.find(site => site.id === state.currentSite.id);
      }
      return {
        ...state,
        isLoading: false,
        data: nextSites,
        currentSite,
      };
    }

    case SET_CURRENT_SITE: {
      const id = Number(action.siteId);
      return { ...state, currentSite: state.data.find(site => site.id === id) };
    }

    case SITE_ADDED:
      return { ...state, isLoading: false, data: state.data.concat(action.site || []) };

    case SITE_UPDATED:
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
