
import morphdom from 'morphdom';

import dashboard from './components/dashboard';
import newSite from './components/newSite';
import site from './components/site';
import siteLogs from './components/siteLogs';
import siteMedia from './components/siteMedia';
import siteSettings from './components/siteSettings';

import { viewTypes, viewActionTypes } from './constants';

function generateHtml(state) {
  switch (state.currentView.id) {
    case viewTypes.DASHBOARD:
      return dashboard(state);
    case viewTypes.NEW_SITE:
      return newSite(state);
    case viewTypes.SITE:
      return site(state);
    case viewTypes.LOGS:
      return siteLogs(state);
    case viewTypes.MEDIA:
      return siteMedia(state);
    case viewTypes.SETTINGS:
      return siteSettings(state);
    case viewTypes.HOME:
    default:
      return false;
  }
}

export default function render (state, el) {
  let html = generateHtml(state);
  let main = document.createElement('main');

  if (!html) return;

  main.appendChild(html);
  morphdom(el, main, config);
}

const config = {
  onlyChildren: true,
  onNodeDiscarded: (node) => {
    // TODO: clean up event handlers on nodes as they are removed
  }
};
