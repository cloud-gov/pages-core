import keymirror from 'keymirror';

export const buildActionTypes = keymirror({
  // Action for receiving the builds
  BUILDS_RECEIVED: null,
});

export const errorActionTypes = keymirror({
  // Action for failed auth attempts
  AUTH_ERROR: null,
  // Action for failed http requests
  HTTP_ERROR: null
});

export const siteActionTypes = keymirror({
  // Action for rece  iving the sites
  SITES_RECEIVED: null,
  // Action to add a site
  SITE_ADD: null,
  // Action after a site has successfully been added
  SITE_ADDED: null,
  // Action for after a site has been deleted
  SITE_DELETED: null,
  // Config files retrieved from github
  SITE_CONFIGS_RECEIVED: null,
  // Asset files retrieved from github
  SITE_ASSETS_RECEIVED: null
});

export const userActionTypes = keymirror({
  // Action for handling API response for users
  USER_RECEIVED: null,
  // Logout user
  USER_LOGOUT: null
});

export const viewActionTypes = keymirror({
  // Action for changing the view
  CURRENT_VIEW_SET: null
})

export const viewTypes = keymirror({
  // Represents home page
  HOME: null,
  // Represents dashboard/site listing page
  DASHBOARD: null,
  // Represents page to add new sites
  NEW_SITE: null,
  // Represents the main page for a site
  SITE: null,
  // Represents a site media page
  MEDIA: null,
  // Represents a site log page
  LOGS: null,
  // Represents a site setting page
  SETTINGS: null
})
