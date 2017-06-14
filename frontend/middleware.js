import { browserHistory } from 'react-router';
import Notifications from 'react-notification-system-redux';

import { updateRouterType as UPDATE_ROUTER } from './actions/actionCreators/navigationActions';

export const reroute = () => next => (action) => {
  if (action.type !== UPDATE_ROUTER) {
    return next(action);
  }

  browserHistory[action.method](...action.arguments);
  return next(action);
};


export const createNotifier = notificationSettings => store => next => (action) => {
  // This middleware creation function takes a notificationSettings object and
  // returns a Redux middleware. See notificationSettings.js for example settings.
  // The returned middleware checks to see if there is a notificationSetting for
  // the current action type, and if so, calls the appropriate Notifications
  // function (.success(), .error(), etc.) to trigger a popup notification.
  if (notificationSettings[action.type]) {
    const setting = notificationSettings[action.type];
    store.dispatch(
      Notifications[setting.type](setting.params)
    );
  }

  return next(action);
};
