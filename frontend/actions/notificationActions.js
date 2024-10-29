import { error, success } from 'react-notification-system-redux';

import { dispatch } from '../store';

const defaultNotification = {
  title: 'Notification',
  message: 'Notification message',
  position: 'tr',
  autoDismiss: 0,
};

export default {
  success: (message) => {
    dispatch(
      success({
        ...defaultNotification,
        title: 'Success',
        message,
      }),
    );
  },
  error: (message) => {
    dispatch(
      error({
        ...defaultNotification,
        title: 'Error',
        message,
      }),
    );
  },
};
