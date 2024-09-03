import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { shallow } from 'enzyme';

proxyquire.noCallThru();

const fetchBuildMock = sinon.spy();
const buildActions = {
  fetchBuilds: fetchBuildMock,
}

const { SiteBuildsBuild } = proxyquire('../../../../frontend/components/site/siteBuildsBuild', {
  '../icons': {
    IconCheckCircle: () => <span />,
    IconClock: () => <span />,
    IconExclamationCircle: () => <span />,
    IconSpinner: () => <span />,
    IconX: () => <span />,
  },
  '../branchViewLink': () => <span className="view-site-link" />,
  '../GithubBuildShaLink': () => <span className='sha-link' />,
  '../GithubBuildBranchLink': () => <span className='branch-link' />,
  '../CreateBuildLink': () => <span className="build-link usa-button" />,
  '../CreateScanLink': () => <span className="scan-link usa-button" />,
  '../../actions/buildActions': buildActions,
});
const viewSiteBuildCTA = 'View site preview';

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
const defaultProps = {
  build: defaultBuild,
  // previewBuilds: { main: 1 },
  previewBuilds: { [defaultBuild.branch]: defaultBuild.id },
  showBuildTasks: false,
  site: defaultSite,
}

describe('<SiteBuildsBuild/>', () => {

  describe("should render the branch name and commit details for a build", () => {
    it("should render a username", () => {
      const wrapper = shallow(<SiteBuildsBuild  {...defaultProps} />);
      const branchCell = wrapper.find('td[data-title="Branch"]');
      const commitUserName = branchCell.find('.commit-user');
      expect(commitUserName).to.exist;
      expect(commitUserName.text()).to.equal(defaultBuild.username);
    });
    it("should render a link to the branch on GitHub using <GitHubLink>", () => {
      const wrapper = shallow(<SiteBuildsBuild  {...defaultProps} />);
      const branchCell = wrapper.find('td[data-title="Branch"]');
      const branchLink = branchCell.find('.branch-info .GitHubLinkMock');
      expect(branchLink).to.exist;
    });
    it("should render a link to the sha on GitHub using <GitHubLink>", () => {
      const wrapper = shallow(<SiteBuildsBuild  {...defaultProps} />);
      const branchCell = wrapper.find('td[data-title="Branch"]');
      const commitSha = branchCell.find('.commit-info .GitHubLinkMock');
      expect(commitSha).to.exist;
    });
  });

  it('should render an empty string for the username for builds where there is no user', () => {
    let modifiedProps = {
      ...defaultProps,
      build: {
        ...defaultBuild,
        username: undefined
      }
    }

    const wrapper = shallow(<SiteBuildsBuild  {...modifiedProps} />);
    const userNameSpan = wrapper.find('.commit-user');
    expect(userNameSpan.text()).to.equal('');
  });


  it('should render a `BranchViewLink` component if state is successful and is a preview build', () => {
    const wrapper = shallow(<SiteBuildsBuild  {...defaultProps} />);
    const resultsCell = wrapper.find('td[data-title="Results"]');
    expect(resultsCell).to.exist;
    expect(wrapper.find('p.site-link')).to.have.length(1);
    expect(resultsCell.find('p.site-link')).to.have.length(1);
  });

  it('should not render a `BranchViewLink` component if state is not successful', () => {
    let modifiedProps = {
      ...defaultProps,
      build: {
        ...defaultBuild,
        state: 'error'
      }
    }
    const wrapper = shallow(<SiteBuildsBuild  {...modifiedProps} />);
    expect(wrapper.find('.view-site-link')).to.have.length(0);
  });

  it('should not render a `BranchViewLink` component if state is queued', () => {
    let modifiedProps = {
      ...defaultProps,
      build: {
        ...defaultBuild,
        state: 'queued'
      }
    }
    const wrapper = shallow(<SiteBuildsBuild  {...modifiedProps} />);
    expect(wrapper.find('.view-site-link')).to.have.length(0);
  });

  it('should not error if state is unkown/unexpected', () => {
    let modifiedProps = {
      ...defaultProps,
      build: {
        ...defaultBuild,
        state: 'unexpected'
      }
    }
    const wrapper = shallow(<SiteBuildsBuild  {...modifiedProps} />);
    expect(wrapper.find('.view-site-link')).to.have.length(0);
  });

});
