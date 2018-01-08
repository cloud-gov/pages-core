import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import SitePublishedBranchesTable from '../../../../frontend/components/site/sitePublishedBranchesTable';

describe('<SitePublishedBranchesTable/>', () => {
  it('should render a table with branches from the state', () => {
    const props = {
      params: { id: '1' },
      publishedBranches: {
        isLoading: false,
        data: [
          { name: 'branch-a', viewLink: 'www.example.gov/branch-a', site: { id: 1 } },
          { name: 'branch-b', viewLink: 'www.example.gov/branch-b', site: { id: 1 } },
        ],
      },
    };

    const wrapper = shallow(<SitePublishedBranchesTable {...props} />);
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('table').contains('branch-a')).to.be.true;
    expect(wrapper.find('table').contains('branch-b')).to.be.true;
  });

  it('should render a loading state if branch data is loading', () => {
    const props = {
      params: { id: '1' },
      publishedBranches: { isLoading: true },
    };

    const wrapper = shallow(<SitePublishedBranchesTable {...props} />);
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no published branches', () => {
    const props = {
      params: { id: '1' },
      publishedBranches: { isLoading: false, data: [] },
    };

    const wrapper = shallow(<SitePublishedBranchesTable {...props} />);
    expect(wrapper.find('table')).to.have.length(0);
    expect(wrapper.find('AlertBanner').prop('header')).to.equal(
      'No branches have been published.'
    );
    expect(wrapper.find('AlertBanner').prop('message')).to.equal(
      'Please wait for build to complete or check logs for error message.'
    );
  });
});
