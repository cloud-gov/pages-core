import React from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';
import { connect } from 'react-redux';

import { USER, ALERT, SITE } from '../propTypes';
import alertActions from '../actions/alertActions';
import LoadingIndicator from './LoadingIndicator';
import io from 'socket.io-client';

export class App extends React.Component {

  componentWillReceiveProps(nextProps) {
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
    const { user, children, notifications, sites } = this.props;

    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        socket.on('build status', function (build) {
          const site = sites.data.find(s => s.id === build.site);
          if (site) {
            let body;
            switch (build.state) {
              case 'error':
                body = 'A build has failed. Please view the logs for more information.';
                break;
              case 'processing':
                body = 'A build is in progress';
                break;
              default:
                body = 'A build completed successfully.';
                break;
            }
            new Notification(`${site.owner}/${site.repository}(${build.branch})`, {body, icon})
          }
        });
      }
    });

    if (user.isLoading) {
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
  sites: PropTypes.shape({
    data: PropTypes.arrayOf(SITE),
    isLoading: PropTypes.bool,
  }),
};

App.defaultProps = {
  alert: null,
  children: null,
  location: null,
  user: false,
  notifications: [],
  sites: null,
};

const socket = io('/');
const icon = '/images/favicons/favicon.ico';

const mapStateToProps = ({ alert, notifications, user, sites }) => ({
  alert,
  notifications,
  user,
  sites,
});

export default connect(mapStateToProps)(App);
