import React from 'react';
import PropTypes from 'prop-types';
import Notifications from 'react-notification-system-redux';

import alertActions from '../actions/alertActions';
import LoadingIndicator from './loadingIndicator';
import Header from './header';

function getUsername(storeState) {
  const userState = storeState.user;
  if (!userState.isLoading && userState.data) {
    return userState.data.username;
  }
  return null;
}

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = this.getStateFromStore();
  }

  componentWillReceiveProps(nextProps) {
    const state = this.getStateFromStore();
    const { alert } = state;

    this.shouldClearAlert(alert, nextProps);
    this.setState(state);
  }

  getStateFromStore() {
    return this.context.state.get();
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
    const { children } = this.props;
    const storeState = this.state;

    if (storeState.user.isLoading) {
      return (
        <div>
          <Header />
          <LoadingIndicator />
        </div>
      );
    }
    return (
      <div>
        <Notifications notifications={storeState.notifications} />
        <Header
          username={getUsername(storeState)}
        />
        {children && React.cloneElement(children, {
          storeState,
        })}
      </div>
    );
  }
}

App.contextTypes = {
  state: PropTypes.object,
};

App.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  location: PropTypes.objectOf(PropTypes.string),
};

App.defaultProps = {
  children: null,
  location: null,
};

export default App;
