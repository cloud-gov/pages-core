import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';

import { ALERT } from '../propTypes';
import alertActions from '../actions/alertActions';
import BuildStatusNotifier from '../util/buildStatusNotifier';

function shouldClearAlert(alert, location, nextLocation) {
  // the route we are leaving
  const { key: lastKey } = location;
  // // the route we are moving to
  const { key: nextKey } = nextLocation;

  if (alert.stale) {
    alertActions.clear();
    return;
  }

  // clear an existing alert message if stale, or flag it to be removed on
  // the next route transition
  if (lastKey === nextKey) return;

  if (alert.message) {
    alertActions.update(alert.stale);
  }
}

export function App(props) {
  const { alert, notifier, notifications } = props;
  useEffect(() => {
    notifier.listen();
  }, []);

  const location = useLocation();
  const navigation = useNavigation();
  useEffect(() => {
    if (alert.message && navigation.location) {
      shouldClearAlert(alert, location, navigation.location);
    }
  }, [location, navigation, alert]);

  return (
    <div>
      <Notifications notifications={notifications} />
      <Outlet />
    </div>
  );
}

App.propTypes = {
  alert: ALERT,
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
