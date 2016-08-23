import keymirror from 'keymirror';

export const buildActionTypes = keymirror({
  // Action for receiving the builds
  BUILDS_RECEIVED: null,
});

export const alertActionTypes = keymirror({
  // Action for failed auth attempts
  AUTH_ERROR: null,
  // Action for failed http requests
  HTTP_ERROR: null,
  // Action for successful HTTP requests
  HTTP_SUCCESS: null,
  // Remove alerts from state
  CLEAR: null,
  // Whether the message can be safely removed from the UI
  SET_STALE: null
});

export const navigationTypes = keymirror({
  // Action when route has changed
  ROUTE_CHANGED: null,
  // Tell react-router to navigate to a new path programatically
  UPDATE_ROUTER: null
});

export const routeTypes = keymirror({
  // Represents dashboard/site listing page
  DASHBOARD: null,
  // Represents page to add new sites
  NEW_SITE: null,
  // Represents the main page for a site
  SITE: null,
  // Represents a site content editor page
  SITE_CONTENT: null,
  // Represents a site media page
  SITE_MEDIA: null,
  // Represents a site log page
  SITE_LOGS: null,
  // Represents a site setting page
  SITE_SETTINGS: null,
  // Represents an edit page
  PAGE_EDIT: null
});

export const siteActionTypes = keymirror({
  // Action for rece  iving the sites
  SITES_RECEIVED: null,
  // Action to add a site
  SITE_ADD: null,
  // Action after a site has successfully been added
  SITE_ADDED: null,
  SITE_UPDATED: null,
  // Action for after a site has been deleted
  SITE_DELETED: null,
  // Config files retrieved from github
  SITE_CONFIGS_RECEIVED: null,
  // Asset files retrieved from github
  SITE_ASSETS_RECEIVED: null,
  // All files that aren't config or assets retrieved from github
  SITE_FILES_RECEIVED: null,
  SITE_FILE_ADDED: null,
  // When an individual file/path is received
  SITE_FILE_CONTENT_RECEIVED: null
});

export const userActionTypes = keymirror({
  // Action for handling API response for users
  USER_RECEIVED: null,
  // Logout user
  USER_LOGOUT: null
});

//TODO: Is there a way to generate this dynamically with a loop?
export const sideNavPaths = {
  MEDIA: 'media',
  PAGES: 'pages',
  SETTINGS: 'settings',
  LOGS: 'logs'
};
