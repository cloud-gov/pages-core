import { siteActionTypes } from '../constants';

const initialState = [];

export default function sites(state = initialState, action) {
  switch (action.type) {
  case siteActionTypes.SITES_RECEIVED:
    return action.sites || initialState;
  case siteActionTypes.SITE_ADDED:
    // if a site hasn't been properly added, return the existing state
    // TODO: why is this getting called if there is an error
    return action.site ? [...state, action.site] : state;
  case siteActionTypes.SITE_UPDATED:
    return mapPropertyToMatchingSite(state, action.siteId, action.site);
  case siteActionTypes.SITE_CONFIGS_RECEIVED:
    return mapPropertyToMatchingSite(state, action.siteId, action.configs);
  case siteActionTypes.SITE_ASSETS_RECEIVED:
    return mapPropertyToMatchingSite(state, action.siteId, { assets: action.assets });
  case siteActionTypes.SITE_CONTENTS_RECEIVED:
    return mapPropertyToMatchingSite(state, action.siteId, { files: action.files });
  case siteActionTypes.SITE_DELETED:
    return state.filter((site) => site.id != action.siteId);
  case siteActionTypes.SITE_CHILD_CONTENT_RECEIVED:
    const nextMap = {};
    nextMap[action.path || '/'] = action.files || [];

    return state.map((site) => {
      if (site.id !== action.siteId) return site;

      const currentMap = site.childDirectoriesMap || {};

      return Object.assign({}, site, {
        childDirectoriesMap: Object.assign({}, currentMap, nextMap)
      });
    });
  case siteActionTypes.SITE_FILE_CONTENT_RECEIVED:
    const currentSite = state.filter((site) => site.id === action.siteId).pop();
    const siteFiles = currentSite.files || [];
    const files = siteFiles.map((file) => {
      if (file.sha !== action.file.sha) return file;
      return Object.assign({}, file, action.file);
    });
    const alreadyHaveFile = files.find((file) => file.sha === action.file.sha);

    if (!alreadyHaveFile) files.push(action.file);
    return mapPropertyToMatchingSite(state, action.siteId, {files})
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
