import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import LoadingIndicator from '../../../../frontend/components/loadingIndicator';
import SitePublishedFilesTable from '../../../../frontend/components/site/sitePublishedFilesTable';


describe('<SitePublishedFilesTable/>', () => {
  it('should render the branch name', () => {
    const publishedBranch = { name: 'master', viewLink: 'www.example.gov/master' };
    const props = {
      params: { id: '1', name: 'master' },
      publishedFiles: {
        isLoading: false,
        data: [
          { name: 'abc', publishedBranch },
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find('h3').contains('master')).to.be.true;
  });

  it('should render a table with the files for the given branch', () => {
    const correctBranch = { name: 'master', viewLink: 'www.example.gov/master' };
    const incorrectBranch = { name: 'preview', viewLink: 'www.example.gov/preview' };
    const props = {
      params: { id: '1', name: 'master' },
      publishedFiles: {
        isLoading: false,
        data: [
          { name: 'abc', publishedBranch: correctBranch },
          { name: 'abc/def', publishedBranch: correctBranch },
          { name: null, publishedBranch: correctBranch }, // shouldn't be rendered b/c no name
          { name: 'xyz', publishedBranch: incorrectBranch },
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;
  });

  it('should render a loading state if the files are loading', () => {
    const props = {
      params: { id: '1', name: 'master' },
      publishedFiles: { isLoading: true },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no files', () => {
    const props = {
      params: { id: '1', name: 'master' },
      publishedFiles: { isLoading: false, data: [] },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find('p').contains('No published branch files available.')).to.be.true;
  });
});
