import React from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';

import alertActions from '../actions/alertActions';
import LoadingIndicator from './loadingIndicator';

export class App extends React.Component {
  componentWillReceiveProps(nextProps) {
    const { alert } = this.props;
    this.shouldClearAlert(alert, nextProps);
  }

  shouldClearAlert(alert, nextProps) {
    const { location: { key: lastKey } } = this.props;
    const { key: nextKey } = nextProps.location;

    // clear an existing alert message if stale, or flag it to be removed on
    // the next route transition
    if (lastKey === nextKey) return;

    if (alert.message) {
      alertActions.update(alert.stale);
    }
  }

  render() {
    const { user, children, notifications } = this.props;

    if (user.isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <div>
        <Notifications notifications={notifications} />
        { children && React.cloneElement(children, { storeState: this.props }) }
      </div>
    );
  }
}

App.propTypes = {
  alert: PropTypes.shape({
    message: PropTypes.string,
    stale: PropTypes.bool,
  }),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  location: PropTypes.shape({
    key: PropTypes.string,
  }),
  user: PropTypes.oneOfType([
    // When the user is not auth'd, this prop is false, which is a little weird
    PropTypes.bool,
    PropTypes.shape({
      isLoading: PropTypes.bool.isRequired,
      data: PropTypes.shape({
        createdAt: PropTypes.string.isRequired,
        updatedAt: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
      }),
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
};

App.defaultProps = {
  alert: null,
  children: null,
  location: null,
  user: null,
  notifications: [],
};

export default connect(state => state)(App);
