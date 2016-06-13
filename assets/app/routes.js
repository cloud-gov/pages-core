
import store from './store';
import { viewTypes, viewActionTypes } from './constants';

import siteActions from './actions/siteActions';

function setView(view, siteId) {
  store.dispatch({
    type: viewActionTypes.CURRENT_VIEW_SET,
    view,
    siteId
  });
}

const dashboard = () => {
  setView(viewTypes.DASHBOARD);
}

const addSite = () => {
  setView(viewTypes.NEW_SITE);
}

const site = (id) => {
  setView(viewTypes.SITE, +id);
}

const siteLogs = (id) => {
  setView(viewTypes.LOGS, +id);
}

const siteMedia = (id) => {
  let site = store.getState().sites.filter((s) => {
    return s.id === id;
  }).pop();

  console.log('site', site);

  siteActions.fetchSiteAssets(site);
  setView(viewTypes.MEDIA, +id);
}

const siteSettings = (id) => {
  setView(viewTypes.SETTINGS, +id);
}



const edit = (id, branch, file) => {
  console.log('edit args', ...arguments);
}

const routes = {
  'dashboard': dashboard,
  'new': addSite,
  'site/:id/edit/:branch(/)*file': edit,
  'site/:id/logs': siteLogs,
  'site/:id/media': siteMedia,
  'site/:id/settings': siteSettings,
  'site/:id': site
}

export default routes;
