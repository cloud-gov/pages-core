import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

const { SiteBuilds, REFRESH_INTERVAL } = proxyquire('../../../../frontend/components/site/siteBuilds', {
  '../icons': {
    IconCheckCircle: 'IconCheckCircle',
    IconClock: 'IconClock',
    IconExclamationCircle: 'IconExclamationCircle',
    IconSpinner: 'IconSpinner',
  },
});

let user;
let site;
let build;
let props;

describe('<SiteBuilds/>', () => {
  beforeEach(() => {
    user = {
      id: 1,
      username: 'user123',
    };
    site = {
      id: 5,
      owner: 'an-owner',
      repository: 'the-repo',
    };
    build = {
      user,
      site,
      id: 1,
      branch: 'main',
      createdAt: '2016-12-28T12:00:00',
      startedAt: '2016-12-28T12:01:00',
      completedAt: '2016-12-28T12:05:00',
      state: 'success',
      webhookCommitSha: '123A',
      username: 'build-username',
    };
    props = {
      builds: {
        data: [build],
        isLoading: false,
      },
      site,
      id: '5',
      actions: {
        fetchBuilds: sinon.spy(),
        restartBuild: sinon.spy(),
      },
    };
  });

  const columnIndex = (wrapper, name) => {
    let index;
    wrapper.find('tr').children().forEach((child, childIndex) => {
      if (child.contains(name)) {
        index = childIndex;
      }
    });
    return index;
  };

  it("should render the username for a build's user", () => {
    const wrapper = shallow(<SiteBuilds {...props} />);
    const userIndex = columnIndex(wrapper, 'User');

    const userCell = wrapper.find('tr').at(1).find('td').at(userIndex - 1);
    expect(userCell.text()).to.equal(build.username);
  });

  it('should render an empty string for the username for builds where there is no user', () => {
    build.username = undefined;
    const wrapper = shallow(<SiteBuilds {...props} />);

    const userCell = wrapper.find('td[data-title="User"]');
    expect(userCell.text()).to.equal('');
  });

  it('should render a `-` if the commit SHA is absent', () => {
    build.webhookCommitSha = null;
    build.state = 'processing';

    const siteBuild = props.builds.data[0];
    const { owner, repository } = siteBuild.site;

    const wrapper = shallow(<SiteBuilds {...props} />);

    expect(wrapper.find({ owner, repository, branch: build.branch })).to.have.length(1);
  });

  it('should render a `GitHubLink` component if commit SHA present', () => {
    const wrapper = shallow(<SiteBuilds {...props} />);
    const siteBuild = props.builds.data[0];
    const { webhookCommitSha } = siteBuild;
    const { owner, repository } = siteBuild.site;

    expect(wrapper.find({ owner, repository, sha: webhookCommitSha })).to.have.length(1);
  });

  it('should render a `BranchViewLink` component if state is successful', () => {
    const wrapper = shallow(<SiteBuilds {...props} />);
    const siteBuild = props.builds.data[0];
    const params = { branchName: siteBuild.branch, site: props.site, showIcon: true };
    expect(wrapper.find(params)).to.have.length(1);
  });

  it('should not render a `BranchViewLink` component if state is not successful', () => {
    props.builds.data[0].state = 'error';
    const wrapper = shallow(<SiteBuilds {...props} />);
    const siteBuild = props.builds.data[0];
    const params = { branchName: siteBuild.branch, site: props.site, showIcon: true };
    expect(wrapper.find(params)).to.have.length(0);
  });

  it('should not render a `BranchViewLink` component if state is queued', () => {
    props.builds.data[0].state = 'queued';
    const wrapper = shallow(<SiteBuilds {...props} />);
    const siteBuild = props.builds.data[0];
    const params = { branchName: siteBuild.branch, site: props.site, showIcon: true };
    expect(wrapper.find(params)).to.have.length(0);
  });

  it('should not error if state is unkown/unexpected', () => {
    props.builds.data[0].state = 'unexpected';
    const wrapper = shallow(<SiteBuilds {...props} />);
    const siteBuild = props.builds.data[0];
    const params = { branchName: siteBuild.branch, site: props.site, showIcon: true };
    expect(wrapper.find(params)).to.have.length(0);
  });

  it('should render a button to refresh builds', () => {
    const wrapper = shallow(<SiteBuilds {...props} />);
    expect(wrapper.find('RefreshBuildsButton')).to.have.length(1);
  });

  it('should render an empty state if no builds are present', () => {
    props.builds = { isLoading: false, data: [] };
    props.site = { id: 5 };
    const wrapper = shallow(<SiteBuilds {...props} />);

    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('AlertBanner').prop('header')).to.equal('This site does not yet have any builds.');
    expect(wrapper.find('AlertBanner').prop('message')).to.equal(
      'If this site was just added, the first build should be available within a few minutes.'
    );
    expect(wrapper.find('RefreshBuildsButton')).to.have.length(1);
  });

  it('should render a paragraph about truncation if 100 or more builds are present', () => {
    props.builds.data = Array(100).fill(1).map((val, index) => Object.assign(build, { id: index }));

    const wrapper = shallow(<SiteBuilds {...props} />);
    expect(wrapper.find('table + p')).to.have.length(1);
    expect(wrapper.find('table + p').contains('List only displays 100 most recent builds.')).to.be.true;
  });

  it('should render a loading state if the builds are loading', () => {
    props.builds = { isLoading: true };
    props.site = { id: 5 };

    const wrapper = shallow(<SiteBuilds {...props} />);

    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should fetch the builds on mount', () => {
    const spy = props.actions.fetchBuilds;

    shallow(<SiteBuilds {...props} />);
    expect(spy.calledOnce).to.equal(true);
  });

  describe('Auto Refresh', () => {
    const AUTO_REFRESH_SELECTOR = '[data-test="toggle-auto-refresh"]';

    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should default to auto refresh: OFF', () => {
      const wrapper = shallow(<SiteBuilds {...props} />);
      expect(wrapper.state('autoRefresh')).to.equal(false);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: OFF');
    });

    it('should toggle auto refresh when the `auto refresh` button is clicked', () => {
      const wrapper = shallow(<SiteBuilds {...props} />);

      wrapper.find(AUTO_REFRESH_SELECTOR).simulate('click');
      expect(wrapper.state('autoRefresh')).to.equal(true);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: ON');

      wrapper.find(AUTO_REFRESH_SELECTOR).simulate('click');
      expect(wrapper.state('autoRefresh')).to.equal(false);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: OFF');
    });

    it('should refresh builds according to the refresh interval when `auto refresh` is on', () => {
      const spy = props.actions.fetchBuilds;

      const wrapper = shallow(<SiteBuilds {...props} />);
      wrapper.setState({ autoRefresh: true });
      clock.tick(REFRESH_INTERVAL + 1000);
      expect(spy.callCount).to.equal(2);
    });

    it('should NOT refresh builds when `auto refresh` is turned off', () => {
      const spy = props.actions.fetchBuilds;

      shallow(<SiteBuilds {...props} />);
      clock.tick(REFRESH_INTERVAL + 1000);
      expect(spy.callCount).to.equal(1);
    });
  });
});
