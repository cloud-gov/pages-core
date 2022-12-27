import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import lodashClonedeep from 'lodash.clonedeep';
import proxyquire from 'proxyquire';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import mountRouter from '../../support/_mount';

proxyquire.noCallThru();

const fetchPublishedFiles = spy();
const publishedFileActions = {
  fetchPublishedFiles,
};

const { SitePublishedFilesTable } = proxyquire(
  '../../../../frontend/components/site/SitePublishedFilesTable',
  {
    '../../actions/publishedFileActions': publishedFileActions,
  }
);

let state;
let props;
const defaultState = {
  publishedFiles: {
    data: {
      files: [],
    },
    isLoading: false,
  },
};

describe('<SitePublishedFilesTable/>', () => {
  beforeEach(() => {
    state = lodashClonedeep(defaultState);
  });

  it('calls fetchPublishedFiles on mount', () => {
    mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/funkyBranch', state);
    expect(fetchPublishedFiles.calledOnce).to.be.true;
    expect(fetchPublishedFiles.calledWith({ id: '11' }, 'funkyBranch', null)).to.be.true;
  });

  it('should render the branch name', () => {
    const publishedBranch = { name: 'main', site: { viewLink: 'www.example.gov/main' } };
    state.publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [
          {
            name: 'abc', size: 123, key: 'prefix/abc', publishedBranch,
          },
        ],
      },
    };
    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/main', state);
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

    state.publishedFiles = {
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

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/demo', state);
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons should not be present if the first page is not truncated
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

    state.publishedFiles = {
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

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/preview', state);

    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons not should be present if the first page is not truncated
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

    state.publishedFiles = {
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

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/main', state);

    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('tbody > tr')).to.have.length(2);
    expect(wrapper.find('table').contains('abc')).to.be.true;
    expect(wrapper.find('table').contains('abc/def')).to.be.true;
    expect(wrapper.find('table').contains('xyz')).to.be.false;

    // paging buttons should not be present if the first page is not truncated
    const buttons = wrapper.find('button');
    expect(buttons).to.have.length(0);
  });

  it('should render previous and next buttons if files are truncated', () => {
    const publishedBranch = { name: 'main', site: { viewLink: 'www.example.gov/main' } };

    state.publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: true,
        files: [
          {
            name: 'abc', size: 123, key: 'prefix/abc', publishedBranch,
          },
        ],
      },
    };

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/main', state);

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
    state.publishedFiles.isLoading = true;

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/demo', state);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no files', () => {
    state.publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: false,
        files: [],
      },
    };

    const wrapper = mountRouter(<SitePublishedFilesTable id="11" path="/published/:name" />, '/published/demo', state);
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

    const publishedFiles = {
      isLoading: false,
      data: {
        isTruncated: true,
        files: [
          {
            name: 'a', size: 1, key: 'prefix/a', publishedBranch,
          },
          {
            name: 'b', size: 2, key: 'prefix/b', publishedBranch,
          },
          {
            name: 'c', size: 3, key: 'prefix/c', publishedBranch,
          },
        ],
      },
    };

    const getPrevButton = w => w.find('nav.pagination button').at(0);
    const getNextButton = w => w.find('nav.pagination button').at(1);

    beforeEach(() => {
      state = lodashClonedeep(defaultState);
      state.publishedFiles = publishedFiles;
      wrapper = mountRouter(<SitePublishedFilesTable id="1" path="/published/:name" />, '/published/main', state);
      prevButton = getPrevButton(wrapper);
      nextButton = getNextButton(wrapper);
    });

    it('cannot go before the first page', () => {
      expect(prevButton.prop('disabled')).to.be.true;
    });

    // TODO: reimplement clicks with react-testing-library
    // it('can go to the next page', () => {
    //   expect(nextButton.prop('disabled')).to.be.false;
    //   nextButton.simulate('click');
    //   expect(fetchPublishedFiles.calledTwice).to.be.true;
    //   expect(fetchPublishedFiles.calledWith({ id: '1' }, 'main', 'prefix/c')).to.be.true;
    // });

    // it('cannot go past the last page', () => {
    //   // click once to go to next page
    //   nextButton.simulate('click');

    //   // modify the props to no longer be truncated
    //   state.publishedFiles.data.isTruncated = false;

    //   // next button should now be disabled
    //   nextButton = getNextButton(wrapper);
    //   expect(nextButton.prop('disabled')).to.be.true;
    // });

    // it('can go to the previous page', () => {
    //   wrapper.instance().setState({ lastPage: 1 });
    //   nextButton = getNextButton(wrapper);
    //   // click once to go to next page
    //   nextButton.simulate('click');
    //   expect(fetchPublishedFiles.calledTwice).to.be.true;

    //   // prev button should now be enabled
    //   prevButton = getPrevButton(wrapper);
    //   expect(prevButton.prop('disabled')).to.be.false;

    //   prevButton.simulate('click');
    //   expect(fetchPublishedFiles.calledTwice).to.be.true;
    // });
  });
});
