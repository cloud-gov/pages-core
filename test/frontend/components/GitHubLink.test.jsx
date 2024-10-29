import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const GitHubLink = proxyquire('../../../frontend/components/GitHubLink', {
  './icons': {
    IconGitHub: 'IconGitHub',
  },
}).default;

describe('<GitHubLink/>', () => {
  it('renders', () => {
    const props = {
      owner: 'owner',
      repository: 'a-repo',
      text: 'link text',
    };
    const wrapper = shallow(<GitHubLink {...props} />)
      .first()
      .shallow();
    expect(wrapper.exists()).to.be.true;

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal('https://github.com/owner/a-repo');
    expect(anchor.prop('title')).to.equal('View repository on GitHub');
    expect(anchor.text()).to.equal('link text');
    expect(wrapper.find('IconGitHub').exists()).to.be.true;
  });

  it('can link to a branch', () => {
    const props = {
      text: 'link text',
      owner: 'pumpkin-pie',
      repository: 'candle',
      branch: 'the-branch',
    };
    const wrapper = shallow(<GitHubLink {...props} />)
      .first()
      .shallow();
    expect(wrapper.exists()).to.be.true;

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal(
      'https://github.com/pumpkin-pie/candle/tree/the-branch',
    );
    expect(anchor.prop('title')).to.equal('View branch on GitHub');
  });

  it('encodes the branch name', () => {
    const props = {
      text: 'boop',
      owner: 'spam',
      repository: 'potato',
      branch: '#-hash-#',
    };
    const wrapper = shallow(<GitHubLink {...props} />)
      .first()
      .shallow();

    const anchor = wrapper.find('a.repo-link');
    expect(anchor.exists()).to.be.true;
    expect(anchor.prop('href')).to.equal(
      'https://github.com/spam/potato/tree/%23-hash-%23',
    );
  });

  it('links to a specific commit', () => {
    const props = {
      text: 'boop',
      owner: 'zookeeni',
      repository: 'veggies',
      sha: '123A',
    };
    const wrapper = shallow(<GitHubLink {...props} />)
      .first()
      .shallow();
    const commitUrl = `https://github.com/${props.owner}/${props.repository}/commit/${props.sha}`;
    const anchor = wrapper.find('a');

    expect(anchor.prop('href')).to.equal(commitUrl);
  });

  it('uses overrided title attribute if provided', () => {
    const props = {
      text: 'boop',
      owner: 'owner',
      repository: 'a-repo',
      title: 'handy explanation',
    };
    const wrapper = shallow(<GitHubLink {...props} />);

    expect(wrapper.prop('title')).to.equal(props.title);
  });
});
