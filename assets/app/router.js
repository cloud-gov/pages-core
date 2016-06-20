
import uniloc from 'uniloc';

import store from './store';
import { navigationTypes, routeTypes } from './constants';
import navigationActions from './actions/navigationActions';

const { DASHBOARD, NEW_SITE, SITE, SITE_CONTENT, SITE_LOGS, SITE_MEDIA, SITE_SETTINGS } = routeTypes;

function formatHash(hash) {
  let startsWithPoundSlash = /^\#\//;
  return hash.replace(startsWithPoundSlash, '/');
}

function handleNewHash(hash) {
  if (!hash) return;
  const location = router.lookup(formatHash(hash));
  if (!location) return;
  console.log('location', location);
  navigationActions.changedRoute(location);
}

var router = uniloc({
    DASHBOARD: 'GET /sites',
    NEW_SITE: 'GET /sites/new',
    SITE: 'GET /sites/:id',
    SITE_CONTENT: 'GET /sites/:id/edit/:branch(/)*file',
    SITE_LOGS: 'GET /sites/:id/logs',
    SITE_MEDIA: 'GET /sites/:id/media',
    SITE_SETTINGS: 'GET /sites/:id/settings'
  },
  {
    'GET /': DASHBOARD
  }
);

export default {
  init: function() {
    handleNewHash(window.location.hash);
    window.addEventListener('hashchange', (e) => {
      let hash = e.target.window.location.hash;
      handleNewHash(hash);
    });
  },
  lookup: (...args) => router.lookup(...args),
  generate: (...args) => router.generate(...args)
}
