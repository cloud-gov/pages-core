import React from 'react';
import store from '../store';
import alertActions from '../actions/alertActions';
import LoadingIndicator from "./loadingIndicator"
import Header from './header';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = this.getStateFromStore();
  }

  getStateFromStore() {
    return this.context.state.get();
  }

  getUsername(storeState) {
    const userState = storeState.user
    if (!userState.isLoading && userState.data) {
      return userState.data.username
    }
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

    if (storeState.user.isLoading) {
      return (
        <div>
          <Header/>
          <LoadingIndicator/>
        </div>
      )
    } else {
      return (
        <div>
          <Header
            username={this.getUsername(storeState)}
          />
          {children && React.cloneElement(children, {
            storeState: storeState
          })}
        </div>
      );
    }
  }
}

App.contextTypes = {
  state: React.PropTypes.object
};

export default App;
