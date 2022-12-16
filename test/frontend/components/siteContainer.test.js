import React from 'react';
import { Provider } from 'react-redux'
import {  
  createMemorySource,
  createHistory,
  LocationProvider,
  Router
} from '@reach/router';
import { mount } from 'enzyme';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import configureStore from 'redux-mock-store';
import lodashClonedeep from 'lodash.clonedeep';


proxyquire.noCallThru();

const { SiteContainer } = proxyquire(
  '../../../frontend/components/siteContainer',
  { 
    './site/SideNav': () => <div />,
    './site/PagesHeader': () => <div />,
  }
);

let props, state;
const site = {
  id: 1,
  defaultBranch: 'main',
  engine: 'jekyll',
  owner: '18f',
  publishedAt: '2017-06-08T20:53:14.363Z',
  viewLink: 'https://view-link.gov',
  repository: 'test-repo',
  organizationId: 1,
  isActive: true,
};
const organization = {
  id: 1,
  isActive: true,
  name: 'Test Organization',
};

const defaultState =  {
  user: {
    isLoading: false,
    data: {
      id: 1,
      username: 'aUser',
      email: 'aUser@example.gov',
    },
  },
  sites: {
    isLoading: false,
    data: [site],
  },
  organizations: {
    isLoading: false,
    data: [organization],
  },
}

const defaultProps = {
  alert: {},
  id: '1',
  params: {
    branch: 'branch',
    fileName: 'boop.txt',
  },
  path: '/sites/:id'
};

const mockStore = configureStore([]);
const mountRouter = (elem, url = '/', state = {}) => {
  let source = createMemorySource(url)
  let history = createHistory(source)
  return mount(
    <LocationProvider history={history}>
      <Provider store={mockStore(state)}>
        <Router>
          {elem}
        </Router>
      </Provider>
    </LocationProvider>
  );
};

describe('<SiteContainer/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
    props = lodashClonedeep(defaultProps)
  })

  it('renders a LoadingIndicator while sites are loading', () => {
    state.sites.isLoading = true;
    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('renders after sites have loaded', () => {
    state.sites.isLoading = false;
    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('siteSideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  it('renders an error after sites have loaded but no matching site', () => {
    const noSiteProps = { ...defaultProps, id: '2' };
    const wrapper = mountRouter(<SiteContainer {...noSiteProps} />, '/sites/2', state);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders an error after sites if site org is inactive', () => {
    state.organizations.data[0].isActive = false;

    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders after sites have loaded but no matching org', () => {
    state.sites.data[0].organizationId = 2;

    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('siteSideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  it('renders after sites have loaded and site has no org', () => {
    state.sites.data[0].organizationId = null;

    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('siteSideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  context('site is (in)active', () => {
    it('renders an error after sites if site inactive', () => {
      state.sites.data[0].isActive = false;
      const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded but no matching org', () => {
      state.sites.data[0].isActive = false;
      state.sites.data[0].organizationId = 2;

      const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded and site has no org', () => {
      state.sites.data[0].isActive = false;
      state.sites.data[0].organizationId = null;

      const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1', state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });
  });

  it('displays a page title if one is configured for the location', () => {
    // TODO: fix this test, this path shouldn't need to be changed to render this, potentially a router issue
    props.path = '/sites/:id/settings'
    const wrapper = mountRouter(<SiteContainer {...props} />, '/sites/1/settings', state);
    expect(wrapper.find('sitePagesHeader').prop('title')).to.equal('Site settings');
  });
});
