import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import LoadingIndicator from '../../../frontend/components/LoadingIndicator';

describe('<LoadingIndicator/>', () => {
  it('renders', () => {
    const wrapper = shallow(<LoadingIndicator />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('.main-loader')).to.have.length(1);
    expect(wrapper.text()).to.equal('Loading...');
  });
});
