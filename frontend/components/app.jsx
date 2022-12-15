import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';
import { useLocation } from '@reach/router';

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
    alert, notifier, children, notifications, onEnter,
  } = props;
  const location = useLocation();

  useEffect(() => {
    onEnter();
    notifier.listen();
  }, []);

  useEffect(() => {
    if (alert.message) {
      shouldClearAlert(alert);
    }
  }, [location.key]);

  return (
    <div>
      <Notifications notifications={notifications} />
      { children }
    </div>
  );
}

App.propTypes = {
  alert: ALERT,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
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
  children: null,
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
