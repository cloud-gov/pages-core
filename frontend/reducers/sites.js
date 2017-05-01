import {
  sitesReceivedType as SITES_RECEIVED,
  siteAddedType as SITE_ADDED,
  siteUpdatedType as SITE_UPDATED,
  siteDeletedType as SITE_DELETED,
  siteAssetsReceivedType as SITE_ASSETS_RECEIVED,
  siteConfigsReceivedType as SITE_CONFIGS_RECEIVED,
  siteBranchesReceivedType as SITE_BRANCHES_RECEIVED,
  siteInvalidType as SITE_INVALID,
  siteLoadingType as SITE_LOADING
} from '../actions/actionCreators/siteActions';

const initialState = [];

export default function sites(state = initialState, action) {
  switch (action.type) {

  case SITE_LOADING:
    return mapPropertyToMatchingSite(state, action.site.id, {loading: action.loading});

  case SITE_INVALID:
    return mapPropertyToMatchingSite(state, action.site.id, {invalid: action.invalid});

  case SITES_RECEIVED:
    return action.sites || initialState;

  case SITE_ADDED:
    return action.site ? [...state, action.site] : state;

  case SITE_UPDATED:
    return mapPropertyToMatchingSite(state, action.siteId, action.site);

  case SITE_BRANCHES_RECEIVED:
    const branches = action.branches;
    return mapPropertyToMatchingSite(state, action.siteId, { branches });

  case SITE_DELETED:
    return state.filter((site) => site.id != action.siteId);

  default:
    return state;
  }
}

const mapPropertyToMatchingSite = (state, siteId, properties) => {
  return state.map((site) => {
    if (site.id !== siteId) return site;
    return Object.assign({}, site, properties);
  });
};
