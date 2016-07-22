import { siteActionTypes } from "../constants";

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
    });

    return [ ...state, ...newAssets ];
  default:
    return state;
  }
}
