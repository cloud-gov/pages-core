import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';

import { ALERT } from '../propTypes';
import alertActions from '../actions/alertActions';
import BuildStatusNotifier from '../util/buildStatusNotifier';

function shouldClearAlert(alert) {
  if (alert.stale) {
    alertActions.clear();
    return;
  }

  if (alert.message) {
    alertActions.update(alert.stale);
  }
}
export function App(props) {
  const {
    alert, notifier, notifications, onEnter,
  } = props;
  const location = useLocation();

  useEffect(() => {
    notifier.listen();
    onEnter();
  }, []);

  useEffect(() => {
    if (alert.message) {
      shouldClearAlert(alert);
    }
  }, [location.key]);

  return (
    <div>
      <Notifications notifications={notifications} />
      <Outlet />
    </div>
  );
}

App.propTypes = {
  alert: ALERT,
  location: PropTypes.shape({
    key: PropTypes.string,
  }),
  onEnter: PropTypes.func.isRequired,
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      position: PropTypes.string.isRequired,
      autoDismiss: PropTypes.number.isRequired,
      uid: PropTypes.number.isRequired,
    })
  ),
  notifier: PropTypes.shape({
    listen: PropTypes.func.isRequired,
  }),
};

App.defaultProps = {
  alert: null,
  location: null,
  notifications: [],
  notifier: new BuildStatusNotifier(),
};

const mapStateToProps = ({
  alert,
  notifications,
}) => ({
  alert,
  notifications,
});

export default connect(mapStateToProps)(App);
