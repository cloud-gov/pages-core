
import React from 'react';

import { routeTypes } from '../constants';
import store from '../store';

import AddSite from './addSite';
import SiteList from './siteList';
import SiteContainer from './siteContainer';

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let state = this.props.state;
    let navigation = this.props.state.navigation;
    let content;

    switch (navigation.name) {
      case routeTypes.DASHBOARD:
        content = <SiteList sites={ state.sites } />
        break;
      case routeTypes.NEW_SITE:
        content = <AddSite currentUserGithubUsername={ state.user.username }
          currentUserId={ state.user.id }/>
        break;
      case routeTypes.SITE:
      case routeTypes.SITE_CONTENT:
      case routeTypes.SITE_LOGS:
      case routeTypes.SITE_MEDIA:
      case routeTypes.SITE_SETTINGS:
        content = <SiteContainer state={ state } />
        break;
      default:
        content = <h1>Uh oh, something broke.</h1>
        break;
    }

    return (
      <div>
        { content }
      </div>
    );
  }
}

App.propTypes = {
  state: React.PropTypes.object
};

export default App;
