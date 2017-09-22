import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import GitHubMark from '../../../frontend/components/GitHubMark';

describe('<GitHubMark/>', () => {
  it('renders', () => {
    const wrapper = shallow(<GitHubMark />);
    expect(wrapper.exists()).to.be.true;
    const svg = wrapper.find('svg');
    expect(svg).to.have.length(1);
  });
});
