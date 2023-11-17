import React from 'react';
import { expect, assert } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import lodashClonedeep from 'lodash.clonedeep';
import { mountRouter } from '../../support/_mount';
// import buildActions from '../../../../frontend/actions/buildActions'
// import federalistApi from '../../../../frontend/util/federalistApi'

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

const fetchBuildMock = sinon.spy(() => Promise.resolve(defaultBuildData));


const CommitSummary = proxyquire('../../../../frontend/components/site/CommitSummary', {
  '../icons': {
    IconBranch: () => <span />,
  },
  '../../actions/buildActions': { fetchBuild: fetchBuildMock },
  // '../../util/federalistApi': { fetchBuild: fetchBuildMock },
}).default;

proxyquire.noCallThru();

const defaultUser = {
  id: 1,
  username: 'user123',
};
const defaultSite = {
  id: 5,
  owner: 'an-owner',
  repository: 'the-repo',
  organizationId: 1,
};
const defaultBuildData = {
  user: { ...defaultUser },
  site: { ...defaultSite },
  id: 1,
  branch: 'main',
  createdAt: '2016-12-28T12:00:00',
  startedAt: '2016-12-28T12:01:00',
  completedAt: '2016-12-28T12:05:00',
  state: 'success',
  requestedCommitSha: '123A567890',
  clonedCommitSha: '123A567890',
  username: 'build-username',
};

const defaultState = {
  build: {
    isLoading: true,
    data: null
  }
};
const defaultProps = {
  buildId: 1
};


const defaultURL = '/sites/1?branch=branch&fileName=boop.txt';
const path = '/sites/:id';

describe('<CommitSummary />', () => {

  it('should exist', () => {
    assert.isDefined(CommitSummary);
  });


  it('renders a loading state whie loading', () => {
    const wrapper = mountRouter(<CommitSummary {...defaultProps} />, path, defaultURL, defaultState);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('requests build information once on load', () => {
    const wrapper = mountRouter(<CommitSummary {...defaultProps} />, path, defaultURL, defaultState);
    const buildId = 1;
    sinon.assert.calledOnceWithExactly(fetchBuildMock, buildId);
    // expect(fetchBuildMock.callCount).to.equal(1);
    fetchBuildMock.resetHistory();

  });

  describe('after load', () => {
    let wrapper;
    let loadedState = lodashClonedeep(defaultState);
    loadedState.build = {
      isLoading: false,
      data: { ...defaultBuildData }
    };
    beforeEach(() => {
      // stubs.fetchBuildStub = sinon.stub(buildActions, "fetchBuild");
      // stubs.fetchBuildStub.resolves(defaultBuildData)
    });

    afterEach(() => {
      sinon.restore();
    });


    it('renders the branch and github user name for the commit', () => {
      wrapper = mountRouter(<CommitSummary {...defaultProps} />, path, defaultURL, loadedState);
      expect(wrapper.find('.commit-branch')).to.have.length(1);
      expect(wrapper.find('.commit-branch').text()).to.contain(defaultBuildData.branch);
      expect(wrapper.find('.commit-username')).to.have.length(1);
      expect(wrapper.find('.commit-username').text()).to.equal(defaultBuildData.username);
    });

    it('formats a sha link correctly and limits to first 7 chars', () => {
      wrapper = mountRouter(<CommitSummary {...defaultProps} />, path, defaultURL, loadedState);
      expect(wrapper.find('.sha-link')).to.have.length(1);
      expect(defaultBuildData.clonedCommitSha).to.contain(wrapper.find('.sha-link').text());
      expect(wrapper.find('.sha-link').text()).to.have.length(7);
    });
  });
});
