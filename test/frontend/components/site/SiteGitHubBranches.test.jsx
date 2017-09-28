import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const fetchBranchesSpy = spy();

const SiteGitHubBranches = proxyquire('../../../../frontend/components/site/SiteGitHubBranches', {
  '../../actions/githubBranchActions': { fetchBranches: fetchBranchesSpy },
}).SiteGitHubBranches;

describe('<SiteGitHubBranches />', () => {
  it('should render a table of branches', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
      },
      githubBranches: {
        isLoading: false,
        data: [
          { name: 'branch-one' },
          { name: 'branch-two' },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('table')).to.have.length(1);
    const rows = wrapper.find('tbody tr');
    expect(rows).to.have.length(2);
    expect(rows.at(0).find('td').at(0).text()
      .indexOf('branch-one')).to.be.above(-1);
    expect(rows.at(1).find('td').at(0).text()
      .indexOf('branch-two')).to.be.above(-1);
    expect(rows.find('GitHubRepoLink')).to.have.length(2);
    expect(rows.find('Connect(BranchViewLink)')).to.have.length(2);
  });

  it('should render a loading state if branches are loading', () => {
    const props = {
      githubBranches: {
        isLoading: true,
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('should render an empty state if no branches are returned', () => {
    const props = {
      site: {
        owner: 'owner',
        repository: 'repo',
      },
      githubBranches: {
        isLoading: false,
        data: [],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('p')).to.have.length(1);
    expect(wrapper.find('p').contains(
      'No branches were found for this repository. There may have been an error communicating with the GitHub API.')
    ).to.be.true;
  });

  it('should render an loading state site is null', () => {
    const props = {
      site: null,
      githubBranches: {
        isLoading: false,
        data: [{ name: 'boop' }],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('calls the fetchBranches action on mount', () => {
    const props = {
      site: {
        owner: 'owner',
        repository: 'repo',
      },
      githubBranches: {},
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    wrapper.instance().componentDidMount();
    expect(fetchBranchesSpy.calledOnce).to.be.true;
  });
});
