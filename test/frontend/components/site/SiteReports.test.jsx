import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import lodashClonedeep from 'lodash.clonedeep';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import { mountRouter } from '../../support/_mount';

proxyquire.noCallThru();

let state;
// const defaultUser = {
//   id: 1,
//   username: 'user123',
// };
const defaultSite = {
  id: 5,
  owner: 'an-owner',
  repository: 'the-repo',
  organizationId: 1,
};
// const defaultBuild = {
//   user: defaultUser,
//   site: defaultSite,
//   id: 1,
//   branch: 'main',
//   createdAt: '2016-12-28T12:00:00',
//   startedAt: '2016-12-28T12:01:00',
//   completedAt: '2016-12-28T12:05:00',
//   state: 'success',
//   requestedCommitSha: '123A',
//   username: 'build-username',
// };
const defaultSiteBuildTask = {
  id: 1,
  buildTaskTypeId: 1,
  siteId: 5,
  branch: 'main',
  metadata: {
    runDay: 19,
  },
};

const defaultScan = {
  id: 1,
  buildId: 1,
  buildTaskTypeId: 1,
  siteBuildTaskId: 1,
  createdAt: '2016-12-28T12:00:00',
  updatedAt: '2016-12-28T12:01:00',
  status: 'success',
  name: 'Default Scan Name',
  artifact: {
    url: '#',
    size: 12345,
  },
  message: 'This is a scan',
  count: 5,
  Build: {
    user: {
      email: 'fake@user.gov',
    },
  },
  BuildTaskType: {
    name: 'A scan',
  },
};

const defaultOrganization = {
  id: 1,
  name: 'org-1',
};

const defaultState = {
  sites: {
    data: [defaultSite],
    isLoading: false,
  },
  organizations: {
    data: [defaultOrganization],
    isLoading: false,
  },
};

const useBuildTasksForSite = sinon.stub().returns({
  isLoading: false,
  buildTasks: [defaultScan],
});
const useSiteBuildTasks = sinon.stub().returns({
  isLoading: false,
  siteBuildTasks: [defaultSiteBuildTask],
});

const { SiteReports } = proxyquire('../../../../frontend/components/site/SiteReports', {
  '../ReportResultsSummary': () => <span />,
  '../../hooks/useSiteBuildTasks': { useSiteBuildTasks },
  '../../hooks/useBuildTasksForSite': { useBuildTasksForSite },
  '../GithubBuildBranchLink': () => <span />,
  '../GithubBuildShaLink': () => <span />,

});

describe('<SiteReports/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should not error if status is unknown/unexpected', () => {
    useBuildTasksForSite.returns({
      isLoading: false,
      buildTasks: [{ ...defaultScan, status: 'unexpected' }],
    });
    mountRouter(<SiteReports />, '/site/:id/reports', '/site/5/reports', state);
  });

  it('should render an empty state if no reports are present', () => {
    useBuildTasksForSite.returns({
      isLoading: false,
      buildTasks: [],
    });
    const wrapper = mountRouter(<SiteReports />, '/site/:id/reports', '/site/5/reports', state);
    expect(
      wrapper.find('p',
        { children: 'Looks like this site doesn’t have any reports yet.' }
      )
    ).to.exist;
  });

  it('should render as many rows as there are reports, plus one for the table header', () => {
    const N = 4;
    useBuildTasksForSite.returns({
      isLoading: false,
      buildTasks: Array(N)
        .fill(1)
        .map((val, index) => ({ ...defaultScan, id: index })),
    });

    const wrapper = mountRouter(<SiteReports />, '/site/:id/reports', '/site/5/reports', state);
    expect(wrapper.find('table#list tr')).to.have.length(N + 1);
    expect(wrapper.find('table#list + p')).to.have.length(1);
    expect(wrapper.find('table#list + p').text()).to.contain(`Showing ${N} most recent report(s).`);
  });

  it('should render a paragraph about truncation if 100 or more builds are present', () => {
    useBuildTasksForSite.returns({
      isLoading: false,
      buildTasks: Array(100)
        .fill(1)
        .map((val, index) => ({ ...defaultScan, id: index })),
    });

    const wrapper = mountRouter(<SiteReports />, '/site/:id/reports', '/site/5/reports', state);
    expect(wrapper.find('table#list tr')).to.have.length(101); // front end does not actually truncate the list
    expect(wrapper.find('table#list + p + p')).to.have.length(1);
    expect(wrapper.find('table#list + p + p').contains('List only displays 100 most recent reports from the last 180 days.')).to.be.true;
  });

  it('should render a loading state if the reports are loading', () => {
    useBuildTasksForSite.returns({
      isLoading: true,
      buildTasks: [],
    });
    const wrapper = mountRouter(<SiteReports />, '/site/:id/reports', '/site/5/reports', state);
    expect(wrapper.find('table#list')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });
});
