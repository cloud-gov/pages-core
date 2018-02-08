import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const SideNav = proxyquire('../../../../frontend/components/site/SideNav', {
  '../icons': {
    IconBook: 'IconBook',
    IconBranch: 'IconBranch',
    IconCloudUpload: 'IconCloudUpload',
    IconPeople: 'IconPeople',
    IconGear: 'IconGear',
  },
}).default;

describe('<SideNav/>', () => {
  it('should render', () => {
    const props = {
      siteId: 123,
    };

    const wrapper = shallow(<SideNav {...props} />);
    expect(wrapper.exists()).to.be.true;
  });
});
