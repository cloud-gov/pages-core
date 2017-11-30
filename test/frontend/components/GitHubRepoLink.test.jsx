import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import GitHubRepoLink from '../../../frontend/components/GitHubRepoLink';

describe('<GitHubRepoLink/>', () => {
  it('renders', () => {
    const props = { owner: 'owner', repository: 'a-repo' };
    const wrapper = shallow(<GitHubRepoLink {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('GitHubMark')).to.have.length(1);

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/owner/a-repo');
    expect(anchor.prop('title')).to.equal('View repository');
  });

  it('can link to a branch', () => {
    const props = { owner: 'pumpkin-pie', repository: 'candle', branch: 'the-branch' };
    const wrapper = shallow(<GitHubRepoLink {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('GitHubMark')).to.have.length(1);

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/pumpkin-pie/candle/tree/the-branch');
    expect(anchor.prop('title')).to.equal('View branch');
  });

  it('encodes the branch name', () => {
    const props = { owner: 'spam', repository: 'potato', branch: '#-hash-#' };
    const wrapper = shallow(<GitHubRepoLink {...props} />);

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/spam/potato/tree/%23-hash-%23');
  });

  it('links to a specific commit', () => {
    const props = { owner: 'zookeeni', repository: 'veggies', sha: '123A' };
    const wrapper = shallow(<GitHubRepoLink {...props} />);
    const commitUrl = `https://github.com/${props.owner}/${props.repository}/commits/${props.sha}`;
    const anchor = wrapper.find('a');

    expect(anchor.prop('href')).to.equal(commitUrl);
  });
});
