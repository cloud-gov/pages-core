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
    expect(rows.at(0).find('wrapper').at(0).props().branch)
      .to.equal('branch-one');
    expect(rows.at(1).find('wrapper').at(0).props().branch)
      .to.equal('branch-two');

    // Workaround to select the GitHubIconLink component.
    // See https://github.com/18F/federalist/issues/1325
    expect(rows.find({
      owner: props.site.owner,
      repository: props.site.repository,
    })).to.have.length(2);
    expect(rows.find('Connect(BranchViewLink)')).to.have.length(2);
  });

  it('should order default and demo branches first', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
        defaultBranch: 'default-branch',
        demoBranch: 'demo-branch',
      },
      githubBranches: {
        isLoading: false,
        data: [
          { name: 'branch-one' },
          { name: 'default-branch' },
          { name: 'branch-two' },
          { name: 'demo-branch' },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    const rows = wrapper.find('tbody tr');

    const firstTdWrapperText = row => row.find('wrapper').dive().text();
    console.log(rows.debug());
    expect(firstTdWrapperText(rows.at(0))).to.have.string('default-branch');
    expect(firstTdWrapperText(rows.at(0))).to.have.string('(live branch)');

    expect(firstTdWrapperText(rows.at(1))).to.have.string('demo-branch');
    expect(firstTdWrapperText(rows.at(1))).to.have.string('(demo branch)');

    expect(firstTdWrapperText(rows.at(2))).to.have.string('branch-one');
    expect(firstTdWrapperText(rows.at(3))).to.have.string('branch-two');
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
    expect(wrapper.find('p').text()).to.have.string(
      'No branches were found for this repository. Often this is because the repository is private or has been deleted.'
    );
  });

  it('should render a loading state if site is null', () => {
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
      githubBranches: {
        isLoading: false,
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    wrapper.instance().componentDidMount();
    expect(fetchBranchesSpy.calledOnce).to.be.true;
  });
});
