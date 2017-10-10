import {
  sitesFetchStartedType as SITES_FETCH_STARTED,
  sitesReceivedType as SITES_RECEIVED,
  siteAddedType as SITE_ADDED,
  siteUpdatedType as SITE_UPDATED,
  siteDeletedType as SITE_DELETED,
  siteBranchesReceivedType as SITE_BRANCHES_RECEIVED,
} from '../actions/actionCreators/siteActions';

const initialState = { isLoading: false };

const mapPropertyToMatchingSite = (data, siteId, properties) => data.map((site) => {
  if (site.id !== siteId) return site;
  return Object.assign({}, site, properties);
});

export default function sites(state = initialState, action) {
  switch (action.type) {

    case SITES_FETCH_STARTED:
      return { isLoading: true };

    case SITES_RECEIVED:
      return { isLoading: false, data: action.sites || [] };

    case SITE_ADDED:
      if (action.site) {
        return {
          isLoading: false,
          data: state.data.concat(action.site),
        };
      }
      return state;

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

    default:
      return state;
  }
}
