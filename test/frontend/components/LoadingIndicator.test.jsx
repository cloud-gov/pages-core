import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import LoadingIndicator from '../../../frontend/components/LoadingIndicator';

describe('<LoadingIndicator/>', () => {
  it('renders', () => {
    const wrapper = shallow(<LoadingIndicator />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('.loader')).to.have.length(1);
    expect(wrapper.text()).to.equal('Loading...');
  });
  it('renders a large loader by default', () => {
    const wrapper = shallow(<LoadingIndicator />);
    expect(wrapper.find('.loader--main')).to.have.length(1);
  });
  it('renders a mini loader if given that size prop', () => {
    const wrapper = shallow(<LoadingIndicator size="mini" />);
    expect(wrapper.find('.loader--mini')).to.have.length(1);
  });
  it('renders custom loading text if provided', () => {
    const wrapper = shallow(<LoadingIndicator text="custom loading message" />);
    expect(wrapper.text()).to.contain('custom loading message');
  });
});
