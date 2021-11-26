import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { SiteContainer } from '../../../frontend/components/siteContainer';

let props;
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

describe('<SiteContainer/>', () => {
  beforeEach(() => {
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
      },
      organizations: {
        isLoading: false,
        data: [organization],
      },
      location: {
        pathname: '',
      },
      id: '1',
      params: {
        branch: 'branch',
        fileName: 'boop.txt',
      },
    };
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

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('SideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('PagesHeader')).to.have.length(1);
  });

  it('renders an error after sites have loaded but no matching site', () => {
    const noSiteProps = { ...props, id: '2' };
    const wrapper = shallow(<SiteContainer {...noSiteProps} />);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders an error after sites if site org is inactive', () => {
    const inactiveOrgProps = { ...props };
    inactiveOrgProps.organizations.data[0].isActive = false;

    const wrapper = shallow(<SiteContainer {...inactiveOrgProps} />);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders after sites have loaded but no matching org', () => {
    const noOrgProps = { ...props };
    noOrgProps.sites.data[0].organizationId = 2;

    const wrapper = shallow(<SiteContainer {...noOrgProps} />);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('SideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('PagesHeader')).to.have.length(1);
  });

  it('renders after sites have loaded and site has no org', () => {
    const noOrgProps = { ...props };
    noOrgProps.sites.data[0].organizationId = null;

    const wrapper = shallow(<SiteContainer {...noOrgProps} />);

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('SideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('PagesHeader')).to.have.length(1);
  });

  context('site is (in)active', () => {
    it('renders an error after sites if site inactive', () => {
      const inactiveSiteProps = { ...props };
      inactiveSiteProps.sites.data[0].isActive = false;

      const wrapper = shallow(<SiteContainer {...inactiveSiteProps} />);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded but no matching org', () => {
      const inactiveSiteProps = { ...props };
      inactiveSiteProps.sites.data[0].organizationId = 2;
      inactiveSiteProps.sites.data[0].isActive = false;

      const wrapper = shallow(<SiteContainer {...inactiveSiteProps} />);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded and site has no org', () => {
      const inactiveSiteProps = { ...props };
      inactiveSiteProps.sites.data[0].organizationId = null;
      inactiveSiteProps.sites.data[0].isActive = false;

      const wrapper = shallow(<SiteContainer {...inactiveSiteProps} />);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });
  });

  it('displays a page title if one is configured for the location', () => {
    // eslint-disable-next-line scanjs-rules/assign_to_pathname
    props.location.pathname = 'settings';
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('PagesHeader').prop('title')).to.equal('Site settings');
  });
});
