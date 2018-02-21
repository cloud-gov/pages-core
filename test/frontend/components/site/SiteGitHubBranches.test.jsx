import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const fetchBranchesSpy = spy();

const { SiteGitHubBranches } = proxyquire('../../../../frontend/components/site/SiteGitHubBranches', {
  '../../actions/githubBranchActions': { fetchBranches: fetchBranchesSpy },
});

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
          { name: 'branch-one', commit: { sha: '123df' } },
          { name: 'branch-two', commit: { sha: 'fd321' } },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('table')).to.have.length(1);
    const rows = wrapper.find('tbody tr');

    expect(rows).to.have.length(2);

    expect(rows.at(0).find('td').at(0).html())
      .to.have.string('branch-one');
    expect(rows.at(1).find('td').at(0).html())
      .to.have.string('branch-two');

    // Workaround to select the GitHubLink component.
    // See https://github.com/18F/federalist/issues/1325
    const ghLinks = rows.find('GitHubLink');
    expect(ghLinks).to.have.length(2);

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
          { name: 'branch-one', commit: { sha: 'c1' } },
          { name: 'default-branch', commit: { sha: 'b' } },
          { name: 'branch-two', commit: { sha: 'c' } },
          { name: 'demo-branch', commit: { sha: 'a' } },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    const rows = wrapper.find('tbody tr');

    const firstTdHtml = row => row.find('td').at(0).html();

    expect(firstTdHtml(rows.at(0))).to.have.string('default-branch');
    expect(firstTdHtml(rows.at(0))).to.have.string('(live branch)');

    expect(firstTdHtml(rows.at(1))).to.have.string('demo-branch');
    expect(firstTdHtml(rows.at(1))).to.have.string('(demo branch)');

    expect(firstTdHtml(rows.at(2))).to.have.string('branch-one');
    expect(firstTdHtml(rows.at(3))).to.have.string('branch-two');
  });

  it('renders a fallback for unlinkable branch names', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
      },
      githubBranches: {
        isLoading: false,
        data: [
          { name: 'abc-#-def', commit: { sha: 'fd321' } },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    const data = wrapper.find('tbody tr td');

    expect(data.at(1).find('span').text()).to.equal('Unlinkable branch name');
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
    expect(wrapper.find('AlertBanner').prop('header')).to.equal(
      'No branches were found for this repository.'
    );
    expect(wrapper.find('AlertBanner').prop('message')).to.equal(
      'Often this is because the repository is private or has been deleted.'
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

  it('passes the correct props to the `CreateBuildLink` component', () => {
    const props = {
      site: {
        id: 1,
        owner: 'test-owner',
        repository: 'test-repo',
      },
      githubBranches: {
        isLoading: false,
        data: [
          { name: 'branch-one', commit: { sha: '123df' } },
        ],
      },
    };

    const wrapper = shallow(<SiteGitHubBranches {...props} />);
    const buildLink = wrapper.find('CreateBuildLink');
    const actualProps = buildLink.props();

    expect(actualProps.handlerParams).to.deep.equal({
      commit: '123df',
      branch: 'branch-one',
      siteId: 1,
    });
    expect(actualProps.children).to.not.be.null;
    expect(typeof actualProps.handleClick).to.equal('function');
  });
});
