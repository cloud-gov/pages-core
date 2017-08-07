import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SiteGithubBranchesTable from '../../../../frontend/components/site/siteGithubBranchesTable';

let site;
let branches;
let props;

describe('<SiteGithubBranchesTable/>', () => {
  beforeEach(() => {
    site = {
      owner: 'owner-name',
      repository: 'repo-name',
      defaultBranch: 'default-ranch',
      viewLink: 'www.example.com/owner-name/repo-name',
    };
    branches = {
      isLoading: false,
      data: [
        { name: 'branch-name' },
        { name: 'default=branch' },
      ],
    };
    props = { site, branches };
  });

  it('renders a table with a list of branches', () => {
    props.branches.data = [
      { name: 'branch-a' },
      { name: 'branch-b' },
    ];

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    const rows = wrapper.find('tbody').find('tr');

    expect(rows).to.have.length(2);
    expect(rows.at(0).contains('branch-a')).to.be.true;
    expect(rows.at(1).contains('branch-b')).to.be.true;
  });

  it('renders the view URL for the default branch', () => {
    props.branches.data = [
        { name: 'master' },
    ];
    props.site = {
      defaultBranch: 'master',
      viewLink: 'www.example.com',
    };

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    const link = wrapper.find('a');

    expect(link.contains('View')).to.be.true;
    expect(link.prop('href')).to.equal(props.site.viewLink);
  });

  it('renders the view URL for demo branches', () => {
    props.branches.data = [
      { name: 'demo' },
    ];
    props.site = {
      demoBranch: 'demo',
      demoViewLink: 'demo.example.com',
    };

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    const link = wrapper.find('a');

    expect(link.contains('View')).to.be.true;
    expect(link.prop('href')).to.equal(props.site.demoViewLink);
  });

  it('renders the the preview URL for preview branches', () => {
    props.branches.data = [
      { name: 'preview-branch' },
    ];
    props.site = {
      owner: 'owner-name',
      repository: 'repo-name',
      defaultBranch: 'master',
    };
    const previewURL = '/preview/owner-name/repo-name/preview-branch/';

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    const link = wrapper.find('a');

    expect(link.contains('View')).to.be.true;
    expect(link.prop('href')).to.equal(previewURL);
  });

  it('renders an error if a site has no branch data', () => {
    props.branches.data = [];

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    expect(wrapper.find('p').contains('An error occurred while downloading branch data from Github. Often this is because the repo is private or has been deleted.')).to.be.true;
  });

  it('renders an error if the branches state contains an error', () => {
    props.branches.error = new Error("I'm an error ⛔️");

    const wrapper = shallow(<SiteGithubBranchesTable {...props} />);
    expect(wrapper.find('p').contains('An error occurred while downloading branch data from Github. Often this is because the repo is private or has been deleted.')).to.be.true;
  });
});
