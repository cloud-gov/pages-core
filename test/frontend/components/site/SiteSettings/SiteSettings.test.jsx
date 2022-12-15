import React from 'react';
import { Provider } from 'react-redux'
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import {  
  createMemorySource,
  createHistory,
  LocationProvider,
  Router
} from '@reach/router';
import configureStore from 'redux-mock-store';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const siteActionsMock = {
  deleteSite: spy(),
  updateSite: spy(),
};

const { SiteSettings } = proxyquire(
  '../../../../../frontend/components/site/SiteSettings',
  { '../../../actions/siteActions': siteActionsMock }
);
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

describe('<SiteSettings/>', () => {
  const state = {
    sites: {
      data: [
        {
          id: 1,
          owner: 'el-mapache',
          repository: 'federalist-modern-team-template',
          domain: 'https://example.gov',
          defaultBranch: 'main',
          demoBranch: 'demo',
          demoDomain: 'https://demo.example.gov',
          engine: 'jekyll',
          basicAuth: {},
          organizationId: 1,
        }
      ]
    },
    organizations: {
      data: [
        {
          id: 1,
          name: 'org-1',
        }
      ]
    }
  };

  let origWindow;
  let wrapper;

  before(() => {
    origWindow = global.window;
  });

  beforeEach(() => {
    siteActionsMock.deleteSite = spy();
    siteActionsMock.updateSite = spy();

    // global.window = { confirm: spy() };
    wrapper = mountRouter(<SiteSettings path="site/:id"/>, '/site/1', state);
  });

  after(() => {
    global.window = origWindow;
  });

  it('should render', () => {
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('[title="Advanced settings"]')).to.have.length(1);
    expect(wrapper.find('ExpandableArea')).to.have.length(2);
  });

  it('should not render if site prop is not defined', () => {
    const formlessWrapper = mountRouter(<SiteSettings path="site/:id"/>);
    expect(formlessWrapper.find('ExpandableArea')).to.have.length(0);
  });
});
