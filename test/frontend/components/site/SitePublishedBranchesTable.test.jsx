import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import lodashClonedeep from 'lodash.clonedeep';

import { mountRouter } from '../../support/_mount';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

proxyquire.noCallThru();

const publishedBranchesSpy = {
  fetchPublishedBranches: spy(),
};
const { SitePublishedBranchesTable } = proxyquire(
  '../../../../frontend/components/site/sitePublishedBranchesTable',
  {
    '../../actions/publishedBranchActions': publishedBranchesSpy,
    '../branchViewLink': () => <div />,
  },
);

const defaultState = {
  publishedBranches: {
    isLoading: false,
    data: [
      {
        name: 'branch-a',
        viewLink: 'www.example.gov/branch-a',
        site: { id: 1 },
      },
      {
        name: 'branch-b',
        viewLink: 'www.example.gov/branch-b',
        site: { id: 1 },
      },
    ],
  },
  sites: {
    data: [
      {
        id: 1,
      },
    ],
  },
};

let state;

describe('<SitePublishedBranchesTable/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
    // props = lodashClonedeep(defaultProps)
  });

  it('should render a table with branches from the state', () => {
    const wrapper = mountRouter(
      <SitePublishedBranchesTable />,
      '/sites/:id/published',
      '/sites/1/published',
      state,
    );
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('table').contains('branch-a')).to.be.true;
    expect(wrapper.find('table').contains('branch-b')).to.be.true;
  });

  it('should render a loading state if branch data is loading', () => {
    state.publishedBranches.isLoading = true;

    const wrapper = mountRouter(
      <SitePublishedBranchesTable />,
      '/sites/:id/published',
      '/sites/1/published',
      state,
    );
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no published branches', () => {
    state.publishedBranches.data = [];

    const wrapper = mountRouter(
      <SitePublishedBranchesTable />,
      '/sites/:id/published',
      '/sites/1/published',
      state,
    );
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('AlertBanner').prop('header')).to.equal(
      'No branches have been published.',
    );
    expect(wrapper.find('AlertBanner').prop('message')).to.equal(
      'Please wait for build to complete or check logs for error message.',
    );
  });

  it('fetches published branches on mount', () => {
    const siteId = '1';
    mountRouter(
      <SitePublishedBranchesTable path="/sites/:id/published" />,
      `/sites/${siteId}/published`,
      state,
    );
    const { fetchPublishedBranches } = publishedBranchesSpy;
    expect(fetchPublishedBranches.calledWith({ id: siteId })).to.be.true;
  });
});
