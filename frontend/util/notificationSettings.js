import { siteUpdatedType as SITE_UPDATED } from '../actions/actionCreators/siteActions';

// For a list of settings that can be used for notifications, see
// https://github.com/igorprado/react-notification-system#creating-a-notification

export const notificationDefaults = {
  position: 'tr', // top-right
  autoDismiss: 3, // seconds
};

export const notificationSettings = {
  // Map of action types to notification settings
  [SITE_UPDATED]: {
    type: 'success',
    params: {
      title: 'Success',
      message: 'Site settings have been updated!',
      ...notificationDefaults,
    },
  },
};
