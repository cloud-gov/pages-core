import { siteActionTypes } from '../constants';

const initialState = [];

export default function sites(state = initialState, action) {
  switch (action.type) {
  case siteActionTypes.SITES_RECEIVED:
    return action.sites || initialState;

  case siteActionTypes.SITE_ADDED:
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
    const site = getSiteWithId(state, action.siteId);
    return mapPropertyToMatchingSite(state, action.siteId, {
      assets: site.assets.concat([action.file])
    });
  }

  case siteActionTypes.SITE_FILES_RECEIVED: {
    const nextFiles = action.files || [];
    const site = getSiteWithId(state, action.siteId);
    let siteFiles;

    if (!site) return state;

    siteFiles = getFilesForSite(site);

    let newFiles = nextFiles.map((file) => {
      const exists = siteFiles.find((f) => f.path === file.path);

      if (!exists) return file;

      // New file doesnt have the same ref, and is therefore on a
      // different branch, return original file
      if (!checkFileRefEquality(file, exists)) {
        return exists;
      }

      return Object.assign({}, exists, file);
    });

    let leftBehind = siteFiles.filter((file) => {
      const added = newFiles.find((f) => f.path === file.path);
      return !added
    });

    return mapPropertyToMatchingSite(state, action.siteId, {
      files: newFiles.concat(leftBehind)
    });
  }

  case siteActionTypes.SITE_DELETED:
    return state.filter((site) => site.id != action.siteId);

  case siteActionTypes.SITE_FILE_CONTENT_RECEIVED:
    const currentSite = getSiteWithId(state, action.siteId);
    // get list of files associated with the current site
    const siteFiles = getFilesForSite(currentSite);

    let files = siteFiles.map((file) => {
      if (file.path !== action.file.path) return file;
      // if the path of the fetched file is equivalent to a path of an existing file,
      // replace it.
      return Object.assign({}, file, action.file);
    });

    if (!files.length) files = [action.file];

    return mapPropertyToMatchingSite(state, action.siteId, {files});

  default:
    return state;
  }
}

// ref is github specific, refers to the branch on which a file lives
const checkFileRefEquality = (fileA, fileB) => {
  const refMatchingRegexp = new RegExp(/(ref=)?=(.+)/);
  const refA = fileA.url.match(refMatchingRegexp)[2];
  const refB = fileB.url.match(refMatchingRegexp)[2];

  return refA === refB;
};

const mapPropertyToMatchingSite = (state, siteId, properties) => {
  return state.map((site) => {
    if (site.id !== siteId) return site;
    return Object.assign({}, site, properties);
  });
};

const getSiteWithId = (state, id) => {
  return state.find((site) => site.id === id);
};

const getFilesForSite = (site) => {
  return site.files || [];
};
