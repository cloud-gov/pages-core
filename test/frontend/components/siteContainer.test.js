import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { spy } from 'sinon';

import { SiteContainer } from '../../../frontend/components/siteContainer';
import siteActions from '../../../frontend/actions/siteActions';

let props;
let setCurrentSite;
const site = {
  id: 1,
  defaultBranch: 'master',
  engine: 'jekyll',
  owner: '18f',
  publishedAt: '2017-06-08T20:53:14.363Z',
  viewLink: 'https://view-link.gov',
  repository: 'test-repo',
};

describe('<SiteContainer/>', () => {
  beforeEach(() => {
    setCurrentSite = spy(siteActions, 'setCurrentSite');
    props = {
      alert: {},
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
        currentSite: site,
      },
      location: {
        pathname: '',
      },
      params: {
        id: '1',
        branch: 'branch',
        fileName: 'boop.txt',
      },
    };
  });

  afterEach(() => {
    setCurrentSite.restore();
  });

  it('renders a LoadingIndicator while sites are loading', () => {
    props.sites = {
      isLoading: true,
    };
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('renders after sites have loaded', () => {
    const wrapper = shallow(<SiteContainer {...props} />);

    wrapper.instance().componentDidMount();

    expect(setCurrentSite.called).to.be.true;
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('SideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('PagesHeader')).to.have.length(1);
  });

  it('renders an error after sites have loaded but no matching site', () => {
    props.sites.currentSite = null;
    const wrapper = shallow(<SiteContainer {...props} />);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('displays a page title if one is configured for the location', () => {
    props.location.pathname = 'settings';
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('PagesHeader').prop('title')).to.equal('Site settings');
  });
});
