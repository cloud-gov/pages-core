import assets from "./reducers/assets";
import builds from "./reducers/builds";
import error from "./reducers/error";
import sites from "./reducers/sites";
import user from "./reducers/user";

const reducers = {
  assets: assets,
  builds: builds,
  error: error,
  sites: sites,
  user: user
};

export { reducers as default };
