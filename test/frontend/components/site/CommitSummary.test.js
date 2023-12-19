import React from 'react';
import { expect, assert } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { mount } from 'enzyme';

import api from '../../../../frontend/util/federalistApi';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

proxyquire.noCallThru();

const fetchBuildMock = sinon.stub();
const buildActions = {
  fetchBuild: fetchBuildMock,
};
const CommitSummary = proxyquire(
  '../../../../frontend/components/site/CommitSummary',
  {
    '../icons': {
      IconBranch: () => <span />,
    },
    '../../actions/buildActions': buildActions,
  }
).default;

const defaultProps = {
  buildId: 1,
};

describe('<CommitSummary />', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should exist', () => {
    assert.isDefined(CommitSummary);
  });

  it('renders a loading state whie loading', () => {
    const stub = sinon.stub(api, 'fetchBuild');
    stub.resolves([]);

    const wrapper = mount(<CommitSummary {...defaultProps} />);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  // no useEffect in tests
  // it('requests build information once on load', () => {
  //   const wrapper = mountStore(<CommitSummary {...defaultProps} />, defaultState);
  //   const buildId = 1;
  //   expect(fetchBuildMock.callCount).to.be.greaterThanOrEqual(1);
  //   fetchBuildMock.resetHistory();
  //   sinon.restore();
  // });

  // describe('after load', () => {
  //   let wrapper;
  //   let loadedState = lodashClonedeep(defaultState);
  //   loadedState.build = {
  //     isLoading: false,
  //     data: { ...defaultBuildData }
  //   };

  //   it('renders the branch and github user name for the commit', () => {
  //     wrapper = mountStore(<CommitSummary {...defaultProps} />, loadedState);
  //     expect(wrapper.find('.commit-branch')).to.have.length(1);
  //     expect(wrapper.find('.commit-branch').text()).to.contain(defaultBuildData.branch);
  //     expect(wrapper.find('.commit-username')).to.have.length(1);
  //     expect(wrapper.find('.commit-username').text()).to.equal(defaultBuildData.username);
  //   });

  //   it('formats a sha link correctly and limits to first 7 chars', () => {
  //     wrapper = mountStore(<CommitSummary {...defaultProps} />, loadedState);
  //     expect(wrapper.find('.sha-link')).to.have.length(1);
  //     expect(defaultBuildData.clonedCommitSha).to.contain(wrapper.find('.sha-link').text());
  //     expect(wrapper.find('.sha-link').text()).to.have.length(7);
  //   });
  // });
});
