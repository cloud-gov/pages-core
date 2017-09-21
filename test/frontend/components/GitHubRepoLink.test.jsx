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
  });
});
