import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import lodashClonedeep from 'lodash.clonedeep';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import { mountRouter } from '../../support/_mount';

proxyquire.noCallThru();

const fetchBuildMock = sinon.spy();
const buildActions = {
  fetchBuilds: fetchBuildMock,
};

const { SiteBuilds, REFRESH_INTERVAL } = proxyquire('../../../../frontend/components/site/siteBuilds', {
  './siteBuildsBuild': () => <tr />,
  '../../actions/buildActions': buildActions,
});

let state;
const defaultUser = {
  id: 1,
  username: 'user123',
};
const defaultSite = {
  id: 5,
  owner: 'an-owner',
  repository: 'the-repo',
  organizationId: 1,
};
const defaultBuild = {
  user: defaultUser,
  site: defaultSite,
  id: 1,
  branch: 'main',
  createdAt: '2016-12-28T12:00:00',
  startedAt: '2016-12-28T12:01:00',
  completedAt: '2016-12-28T12:05:00',
  state: 'success',
  requestedCommitSha: '123A',
  username: 'build-username',
};
const defaultOrganization = {
  id: 1,
  name: 'org-1',
};

const defaultState = {
  builds: {
    data: [defaultBuild],
    isLoading: false,
  },
  sites: {
    data: [defaultSite],
    isLoading: false,
  },
  organizations: {
    data: [defaultOrganization],
    isLoading: false,
  },
};

describe('<SiteBuilds/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
  });

  afterEach(() => {
    fetchBuildMock.resetHistory();
  });

  it('should not error if state is unkown/unexpected', () => {
    state.builds.data[0].state = 'unexpected';
    const wrapper = mountRouter(<SiteBuilds />, '/site/:id/builds', '/site/5/builds', state);
    expect(wrapper.find({ className: 'view-site-link' })).to.have.length(0);
  });

  it('should render an empty state if no builds are present', () => {
    state.builds = { isLoading: false, data: [] };
    const wrapper = mountRouter(<SiteBuilds />, '/site/:id/builds', '/site/5/builds', state);

    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('AlertBanner').prop('header')).to.equal('This site does not yet have any builds.');
    expect(wrapper.find('AlertBanner').prop('message')).to.equal(
      'If this site was just added, the first build should be available within a few minutes.'
    );
  });

  it('should render as many rows as there are builds, plus one for the table header', () => {
    state.builds.data = Array(4)
      .fill(1)
      .map((val, index) => ({ ...defaultBuild, id: index }));

    const wrapper = mountRouter(<SiteBuilds />, '/site/:id/builds', '/site/5/builds', state);
    expect(wrapper.find('table tr')).to.have.length(5);
    expect(wrapper.find('table + p')).to.have.length(1);
    expect(wrapper.find('table + p').text()).to.contain('Showing 4 most recent build(s).');
  });

  it('should render a paragraph about truncation if 100 or more builds are present', () => {
    state.builds.data = Array(100)
      .fill(1)
      .map((val, index) => ({ ...defaultBuild, id: index }));

    const wrapper = mountRouter(<SiteBuilds />, '/site/:id/builds', '/site/5/builds', state);
    expect(wrapper.find('table tr')).to.have.length(101); // front end does not actually truncate the list
    expect(wrapper.find('table + p + p')).to.have.length(1);
    expect(wrapper.find('table + p + p').contains('List only displays 100 most recent builds from the last 180 days.')).to.be.true;
  });

  it('should fetch the builds on mount', () => {
    mountRouter(<SiteBuilds />, '/site/:id/builds', '/site/5/builds', state);
    expect(fetchBuildMock.calledOnce).to.equal(true);
  });
});
