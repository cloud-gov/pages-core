import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import GitHubIconLink from '../../../../frontend/components/GitHubLink/GitHubIconLink';

describe('<GitHubIconLink />', () => {
  const props = { owner: 'owner', repository: 'a-repo' };
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<GitHubIconLink {...props} />);
  });

  it('renders', () => {
    expect(wrapper.exists()).to.be.true;
  });

  it('renders a <GitHubMark/> component', () => {
    expect(wrapper.first().shallow().find('GitHubMark')).to.have.length(1);
  });

  it('renders a <GitHubRepoLink/> component', () => {
    expect(wrapper.first().shallow().find('GitHubRepoLink')).to.have.length(1);
  });
});
