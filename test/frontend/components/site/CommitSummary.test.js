import React from 'react';
import { expect, assert } from 'chai';
import proxyquire from 'proxyquire';
import { mount } from 'enzyme';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

const CommitSummary = proxyquire('../../../../frontend/components/site/CommitSummary', {
  '../icons': {
    IconBranch: () => <span />,
  },
}).default;

const defaultProps = {
  buildDetails: {
    site: {
      owner: 'user',
      repository: 'repo',
    },
    branch: 'branch',
    username: 'username',
    clonedCommitSha: 'sha4567890abcdef',
    createdAt: new Date(),
  },
};

describe('<CommitSummary />', () => {
  it('should exist', () => {
    assert.isDefined(CommitSummary);
  });

  it('renders a loading state while loading', () => {
    const wrapper = mount(
      <CommitSummary
        {...{
          buildDetails: null,
        }}
      />,
    );
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  describe('after load', () => {
    const build = defaultProps.buildDetails;

    it('renders the branch and github user name for the commit', () => {
      const wrapper = mount(<CommitSummary {...defaultProps} />);
      expect(wrapper.find('.commit-branch')).to.have.length(1);
      expect(wrapper.find('.commit-branch').text()).to.contain(build.branch);
      expect(wrapper.find('.commit-username')).to.have.length(1);
      expect(wrapper.find('.commit-username').text()).to.equal(build.username);
    });

    it('formats a sha link correctly and limits to first 7 chars', () => {
      const wrapper = mount(<CommitSummary {...defaultProps} />);
      expect(wrapper.find('.sha-link')).to.have.length(1);
      expect(build.clonedCommitSha).to.contain(wrapper.find('.sha-link').text());
      expect(wrapper.find('.sha-link').text()).to.have.length(7);
    });
  });
});
