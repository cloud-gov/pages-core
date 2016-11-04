
import React from 'react';
import { routeTypes } from '../constants';
import store from '../store';

import alertActions from '../actions/alertActions';

import Header from './header';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = this.getStateFromStore();
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

  componentWillReceiveProps(nextProps) {
    const state = this.getStateFromStore();
    const { alert } = state;

    this.shouldClearAlert(alert, nextProps);
    this.setState(state);
  }

  render() {
    const { children } = this.props;
    const storeState = this.state;

    return (
      <div>
        <Header
          isLoggedIn={ !!storeState.user }
          username={storeState.user.username}
        />
        {children && React.cloneElement(children, {
          storeState: storeState
        })}
      </div>
    );
  }
}

App.contextTypes = {
  state: React.PropTypes.object
};

export default App;
