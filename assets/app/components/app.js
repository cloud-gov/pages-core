
import React from 'react';

import { routeTypes } from '../constants';
import store from '../store';

import AddSite from './addSite';
import SiteList from './siteList';
import SiteContainer from './siteContainer';
import Header from './header';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    const { children } = this.props;
    const storeState = this.context.state;
    let content;

    // switch (navigation.name) {
    //   case routeTypes.DASHBOARD:
    //     content = <SiteList sites={ state.sites } />
    //     break;
    //   case routeTypes.NEW_SITE:
    //     content = <AddSite currentUserGithubUsername={ state.user.username }
    //       currentUserId={ state.user.id }/>
    //     break;
    //   case routeTypes.SITE:
    //   case routeTypes.SITE_CONTENT:
    //   case routeTypes.SITE_LOGS:
    //   case routeTypes.SITE_MEDIA:
    //   case routeTypes.SITE_SETTINGS:
    //     content = <SiteContainer state={ state } />
    //     break;
    //   default:
    //     content = <h1>Uh oh, something broke.</h1>
    //     break;
    // }

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
