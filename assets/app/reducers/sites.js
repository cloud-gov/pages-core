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

  case siteActionTypes.SITE_BRANCHES_RECEIVED:
    const branches = action.branches;
    return mapPropertyToMatchingSite(state, action.siteId, { branches });

  case siteActionTypes.SITE_CONFIGS_RECEIVED:
    return mapPropertyToMatchingSite(state, action.siteId, action.configs);

  case siteActionTypes.SITE_ASSETS_RECEIVED:
    return mapPropertyToMatchingSite(state, action.siteId, { assets: action.assets });

  case siteActionTypes.SITE_UPLOAD_RECEIVED: {
    const site = state.find((site) => site.id === action.siteId);
    return mapPropertyToMatchingSite(state, action.siteId, {
      assets: site.assets.concat([action.file])
    });
  }

  case siteActionTypes.SITE_FILES_RECEIVED:
    const nextFiles = action.files || [];
    const site = state.find((site) => site.id === action.siteId);

    if (!site) return state;

    if (!site.files) {
      return mapPropertyToMatchingSite(state, action.siteId, {
        files: nextFiles
      });
    }

    let newFiles = nextFiles.map((file) => {
      const exists = site.files.find((f) => f.path === file.path);
      if (!exists) return file;

      return Object.assign({}, exists, file);
    });

    let leftBehind = site.files.filter((file) => {
      const added = newFiles.find((f) => f.path === file.path);
      return !added
    });

    return mapPropertyToMatchingSite(state, action.siteId, {
      files: newFiles.concat(leftBehind)
    });

  case siteActionTypes.SITE_DELETED:
    return state.filter((site) => site.id != action.siteId);

  case siteActionTypes.SITE_FILE_CONTENT_RECEIVED:
    const currentSite = state.find((site) => site.id === action.siteId);
    const siteFiles = currentSite.files || [];
    const files = siteFiles.map((file) => {
      if (file.path !== action.file.path) return file;
      return Object.assign({}, file, action.file);
    });
    const exists = files.find((file) => file.path === action.file.path);

    if (!exists) files.push(action.file);
    return mapPropertyToMatchingSite(state, action.siteId, {files});

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
