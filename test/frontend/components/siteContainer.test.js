import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import lodashClonedeep from 'lodash.clonedeep';

import { mountRouter } from '../support/_mount';

proxyquire.noCallThru();

const { SiteContainer } = proxyquire('../../../frontend/components/siteContainer', {
  './site/SideNav': () => <div />,
  './site/PagesHeader': () => <div />,
});

let props;
let state;
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
  SiteBuildTasks: [],
};
const organization = {
  id: 1,
  isActive: true,
  name: 'Test Organization',
};

const defaultState = {
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
};

const defaultProps = {
  alert: {},
};

const defaultURL = '/sites/1?branch=branch&fileName=boop.txt';
const path = '/sites/:id';

describe('<SiteContainer/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
    props = lodashClonedeep(defaultProps);
  });

  it('renders a LoadingIndicator while sites are loading', () => {
    state.sites.isLoading = true;
    const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('renders after sites have loaded', () => {
    state.sites.isLoading = false;
    const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    // expect(wrapper.find('siteSideNav')).to.have.length(1);
    // expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  it('renders an error after sites have loaded but no matching site', () => {
    const url = '/sites/2';
    const wrapper = mountRouter(<SiteContainer {...props} />, path, url, state);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders an error after sites if site org is inactive', () => {
    state.organizations.data[0].isActive = false;

    const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
    const alert = wrapper.find('AlertBanner');

    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(alert).to.have.length(1);
    expect(alert.prop('status')).to.equal('error');
  });

  it('renders after sites have loaded but no matching org', () => {
    state.sites.data[0].organizationId = 2;

    const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    // expect(wrapper.find('siteSideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    // expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  it('renders after sites have loaded and site has no org', () => {
    state.sites.data[0].organizationId = null;

    const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    // expect(wrapper.find('siteSideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    // expect(wrapper.find('sitePagesHeader')).to.have.length(1);
  });

  context('site is (in)active', () => {
    it('renders an error after sites if site inactive', () => {
      state.sites.data[0].isActive = false;
      const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded but no matching org', () => {
      state.sites.data[0].isActive = false;
      state.sites.data[0].organizationId = 2;

      const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });

    it('renders after sites have loaded and site has no org', () => {
      state.sites.data[0].isActive = false;
      state.sites.data[0].organizationId = null;

      const wrapper = mountRouter(<SiteContainer {...props} />, path, defaultURL, state);
      const alert = wrapper.find('AlertBanner');

      expect(wrapper.find('LoadingIndicator')).to.have.length(0);
      expect(alert).to.have.length(1);
      expect(alert.prop('status')).to.equal('error');
    });
  });

  // it('displays a page title if one is configured for the location', () => {
  //   // we artificially change the path to a child route to simulate nesting
  //   const settingsPath = '/sites/:id/settings';
  //   const url = '/sites/1/settings';
  //   const wrapper = mountRouter(<SiteContainer {...props} />, settingsPath, url, state);
  //   console.log(wrapper.html())
  //   expect(wrapper.find('sitePagesHeader').prop('title')).to.equal('Site settings');
  // });
});
