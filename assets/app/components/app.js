
import React from 'react';
import { routeTypes } from '../constants';
import store from '../store';

import Header from './header';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = this.getStateFromStore();
  }

  getStateFromStore() {
    return this.context.state.get();
  }
  componentWillReceiveProps() {
    this.setState(this.getStateFromStore());
  }

  render() {
    const { children } = this.props;
    const storeState = this.state;

    return (
      <div>
        <Header isLoggedIn={ !!storeState.user } />
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
