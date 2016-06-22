
import { render } from 'react-dom';
import React from 'react';
import { Router, browserHistory } from 'react-router';

import buildActions from './actions/buildActions';
import siteActions from './actions/siteActions';
import userActions from './actions/userActions';

import routes from './routes';

import router from './router';
import store from './store';

const mainEl = document.querySelector('#js-app');
class Provider extends React.Component {
  getChildContext() {
    return { state: this.state }
  }

  constructor(props, context) {
    super(props, context)
    this.state = props.state
  }

  render() {
    return React.Children.only(this.props.children)
  }
}
Provider.childContextTypes = {
  state: React.PropTypes.object
};

store.subscribe(() => {
  const state = store.getState();
  if (!!!state.user) return;

  render((
    <Provider state={state}>
      <Router history={browserHistory}>
        {routes}
      </Router>
    </Provider>
  ), mainEl);
});

router.init();

userActions.fetchUser();
siteActions.fetchSites();
// buildActions.fetchBuilds();

window.router = router;
window.store = store;
