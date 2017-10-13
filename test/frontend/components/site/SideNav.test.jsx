import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SideNav from '../../../../frontend/components/site/SideNav';

describe('<SideNav/>', () => {
  it('should render', () => {
    const props = {
      siteId: 123,
    };
    const wrapper = shallow(<SideNav {...props} />);
    expect(wrapper.exists()).to.be.true;
  });
});
