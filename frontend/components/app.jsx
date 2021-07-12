import React from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';

import { ALERT } from '../propTypes';
import alertActions from '../actions/alertActions';
import BuildStatusNotifier from '../util/buildStatusNotifier';

export class App extends React.Component {
  componentDidMount() {
    const { notifier, onEnter } = this.props;
    onEnter();
    notifier.listen();
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { alert } = this.props;

    if (alert.message) {
      this.shouldClearAlert(nextProps);
    }
  }

  shouldClearAlert({ alert, location }) {
    // the route we are leaving
    const { location: { key: lastKey } } = this.props;
    // the route we are moving to
    const { key: nextKey } = location;

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

  render() {
    const {
      children,
      notifications,
    } = this.props;

    return (
      <div>
        <Notifications notifications={notifications} />
        { children }
      </div>
    );
  }
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
