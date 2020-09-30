import React from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';

import { USER, ALERT } from '../propTypes';
import alertActions from '../actions/alertActions';
import LoadingIndicator from './LoadingIndicator';
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
      user,
      children,
      notifications,
      sites,
    } = this.props;

    if (user.isLoading) {
      return <LoadingIndicator />;
    }

    if (sites.isLoading) {
      return <LoadingIndicator />;
    }

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
  user: PropTypes.oneOfType([
    // When the user is not auth'd, this prop is false, which is a little weird
    PropTypes.bool,
    PropTypes.shape({
      isLoading: PropTypes.bool,
      data: USER,
    }),
  ]),
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
  sites: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
  }),
};

App.defaultProps = {
  alert: null,
  children: null,
  location: null,
  user: false,
  notifications: [],
  notifier: new BuildStatusNotifier(),
  sites: {
    isLoading: false,
    data: [],
  },
};

const mapStateToProps = ({
  alert,
  notifications,
  sites,
  user,
}) => ({
  alert,
  notifications,
  sites,
  user,
});

export default connect(mapStateToProps)(App);
