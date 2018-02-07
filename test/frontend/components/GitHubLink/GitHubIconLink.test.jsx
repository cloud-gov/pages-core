import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const GitHubIconLink = proxyquire('../../../../frontend/components/GitHubLink/GitHubIconLink', {
  '../icons': {
    IconGitHub: 'IconGitHub',
  },
}).default;

describe('<GitHubIconLink />', () => {
  const props = { owner: 'owner', repository: 'a-repo' };
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<GitHubIconLink {...props} />);
  });

  it('renders', () => {
    expect(wrapper.exists()).to.be.true;
  });

  it('renders an <IconGitHub/> component', () => {
    expect(wrapper.first().shallow().find('IconGitHub')).to.have.length(1);
  });

  it('renders a <GitHubRepoLink/> component', () => {
    expect(wrapper.first().shallow().find('GitHubRepoLink')).to.have.length(1);
  });
});
