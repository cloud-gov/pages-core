import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import GitHubRepoLink from '../../../../frontend/components/GitHubLink/GitHubRepoLink';
import GitHubURLProvider from '../../../../frontend/components/GitHubLink/GitHubURLProvider';

const RepoLink = GitHubURLProvider(GitHubRepoLink);

describe('<GitHubRepoLink/>', () => {
  it('renders', () => {
    const props = { owner: 'owner', repository: 'a-repo' };
    const wrapper = shallow(<RepoLink {...props} />).first().shallow();
    expect(wrapper.exists()).to.be.true;

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/owner/a-repo');
    expect(anchor.prop('title')).to.equal('View repository');
  });

  it('can link to a branch', () => {
    const props = { owner: 'pumpkin-pie', repository: 'candle', branch: 'the-branch' };
    const wrapper = shallow(<RepoLink {...props} />).first().shallow();
    expect(wrapper.exists()).to.be.true;

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/pumpkin-pie/candle/tree/the-branch');
    expect(anchor.prop('title')).to.equal('View branch');
  });

  it('encodes the branch name', () => {
    const props = { owner: 'spam', repository: 'potato', branch: '#-hash-#' };
    const wrapper = shallow(<RepoLink {...props} />).first().shallow();

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/spam/potato/tree/%23-hash-%23');
  });

  it('links to a specific commit', () => {
    const props = { owner: 'zookeeni', repository: 'veggies', sha: '123A' };
    const wrapper = shallow(<RepoLink {...props} />).first().shallow();
    const commitUrl = `https://github.com/${props.owner}/${props.repository}/commit/${props.sha}`;
    const anchor = wrapper.find('a');

    expect(anchor.prop('href')).to.equal(commitUrl);
  });

  it('uses overrided title attribute if provided', () => {
    const props = { owner: 'owner', repository: 'a-repo', title: 'handy explanation' };
    const wrapper = shallow(<RepoLink {...props} />);

    expect(wrapper.prop('title')).to.equal(props.title);
  });
});
