import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

proxyquire.noCallThru();

const fetchPublishedFiles = spy();

const SitePublishedFilesTable = proxyquire('../../../../frontend/components/site/SitePublishedFilesTable', {
  '../../actions/publishedFileActions': { fetchPublishedFiles },
}).SitePublishedFilesTable;


const deepCopy = obj => JSON.parse(JSON.stringify(obj));

describe('<SitePublishedFilesTable/>', () => {
  beforeEach(() => {
    // reset the spy
    fetchPublishedFiles.reset();
  });

  it('calls fetchPublishedFiles on mount', () => {
    const props = {
      params: { id: '11', name: 'funkyBranch' },
      publishedFiles: { isLoading: false },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    wrapper.instance().componentDidMount();
    expect(fetchPublishedFiles.calledOnce).to.be.true;
    expect(fetchPublishedFiles.calledWith({ id: '11' }, 'funkyBranch', null)).to.be.true;
  });

  it('should render the branch name', () => {
    const publishedBranch = { name: 'main', site: { viewLink: 'www.example.gov/main' } };
    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: true,
      },
    };

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [
          { name: 'abc', size: 123, key: 'prefix/abc', publishedBranch },
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...origProps} />);
    wrapper.setProps({ publishedFiles });

    expect(wrapper.find('h3').contains('main')).to.be.true;
  });

  it('should render a table with the files for the given branch', () => {
    const correctBranch = {
      name: 'demo',
      site: {
        viewLink: 'https://www.example.gov/site/owner/repo/',
        demoBranch: 'demo',
        demoViewLink: 'https://example.gov/demo/owner/repo/',
      },
    };
    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: true,
      },
    };

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [
          { name: 'abc', publishedBranch: correctBranch },
          { name: 'abc/def', publishedBranch: correctBranch },
          { name: null, publishedBranch: correctBranch }, // shouldn't be rendered b/c no name
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...origProps} />);
    wrapper.setProps({ publishedFiles });
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons should be present if the first page is not truncated
    const buttons = wrapper.find('button');
    expect(buttons).to.have.length(0);
  });

  it('should render a table with the files for the given branch', () => {
    const correctBranch = {
      name: 'preview',
      site: {
        viewLink: 'https://www.example.gov/site/owner/repo/',
        previewLink: 'https://www.example.gov/preview/owner/repo/',
      },
    };
    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: true,
      },
    };

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [
          { name: 'abc', publishedBranch: correctBranch },
          { name: 'abc/def', publishedBranch: correctBranch },
          { name: null, publishedBranch: correctBranch }, // shouldn't be rendered b/c no name
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...origProps} />);
    wrapper.setProps({ publishedFiles });
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons should be present if the first page is not truncated
    const buttons = wrapper.find('button');
    expect(buttons).to.have.length(0);
  });

  it('should render a table with the files for the given branch', () => {
    const correctBranch = {
      name: 'main',
      site: {
        viewLink: 'www.example.gov/',
        defaultBranch: 'main',
      },
    };
    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: true,
      },
    };

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [
          { name: 'abc', publishedBranch: correctBranch },
          { name: 'abc/def', publishedBranch: correctBranch },
          { name: null, publishedBranch: correctBranch }, // shouldn't be rendered b/c no name
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...origProps} />);
    wrapper.setProps({ publishedFiles });
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons should be present if the first page is not truncated
    const buttons = wrapper.find('button');
    expect(buttons).to.have.length(0);
  });

  it('should render previous and next buttons if files are truncated', () => {
    const publishedBranch = { name: 'main', site: { viewLink: 'www.example.gov/main' } };
    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: true,
      },
    };

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: true,
        files: [
          { name: 'abc', size: 123, key: 'prefix/abc', publishedBranch },
        ],
      },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...origProps} />);
    wrapper.setProps({ publishedFiles });

    const buttons = wrapper.find('button');
    expect(buttons).to.have.length(2);

    const prevButton = buttons.at(0);
    const nextButton = buttons.at(1);

    expect(prevButton.prop('disabled')).to.be.true;
    expect(prevButton.text()).to.contain('Previous');
    expect(nextButton.prop('disabled')).to.be.false;
    expect(nextButton.text()).to.contain('Next');
  });

  it('should render a loading state if the files are loading', () => {
    const props = {
      params: { id: '1', name: 'main' },
      publishedFiles: { isLoading: true },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no files', () => {
    const props = {
      params: { id: '1', name: 'main' },
      publishedFiles: { isLoading: false, data: { isTruncated: false, files: [] } },
    };

    const wrapper = shallow(<SitePublishedFilesTable {...props} />);
    expect(wrapper.find('AlertBanner').prop('message')).to.equal('No published branch files available.');
  });

  describe('paging', () => {
    let wrapper;
    let prevButton;
    let nextButton;

    const publishedBranch = {
      name: 'main',
      site: { viewLink: 'https://example.com/' },
    };

    const origProps = {
      params: { id: '1', name: 'main' },
      publishedFiles: {
        isLoading: false,
        data: {
          isTruncated: true,
          files: [
            { name: 'a', size: 1, key: 'prefix/a', publishedBranch },
            { name: 'b', size: 2, key: 'prefix/b', publishedBranch },
            { name: 'c', size: 3, key: 'prefix/c', publishedBranch },
          ],
        },
      },
    };

    const getPrevButton = w => w.find('nav.pagination button').at(0);
    const getNextButton = w => w.find('nav.pagination button').at(1);

    beforeEach(() => {
      const props = deepCopy(origProps);
      wrapper = shallow(<SitePublishedFilesTable {...props} />);
      // necessary to call so that componentWillReceiveProps is executed
      wrapper.setProps(props);
      prevButton = getPrevButton(wrapper);
      nextButton = getNextButton(wrapper);
    });

    it('cannot go before the first page', () => {
      expect(prevButton.prop('disabled')).to.be.true;
    });

    it('can go to the next page', () => {
      expect(nextButton.prop('disabled')).to.be.false;
      nextButton.simulate('click');
      expect(fetchPublishedFiles.calledOnce).to.be.true;
      expect(fetchPublishedFiles.calledWith({ id: '1' }, 'main', 'prefix/c')).to.be.true;
    });

    it('cannot go past the last page', () => {
      // click once to go to next page
      nextButton.simulate('click');

      // modify the props to no longer be truncated
      const newProps = deepCopy(origProps);
      newProps.publishedFiles.data.isTruncated = false;
      wrapper.setProps(newProps);

      // next button should now be disabled
      nextButton = getNextButton(wrapper);
      expect(nextButton.prop('disabled')).to.be.true;
    });

    it('can go to the previous page', () => {
      // click once to go to next page
      nextButton.simulate('click');
      expect(fetchPublishedFiles.calledOnce).to.be.true;

      // update props to simulate the fetch of the new page files
      const newProps = deepCopy(origProps);
      wrapper.setProps(newProps);

      // prev button should now be enabled
      prevButton = getPrevButton(wrapper);
      expect(prevButton.prop('disabled')).to.be.false;

      prevButton.simulate('click');
      // fetch should NOT be called again since the previous page
      // comes from state
      expect(fetchPublishedFiles.calledTwice).to.be.false;
    });
  });
});
