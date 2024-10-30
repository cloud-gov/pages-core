import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const PagesHeader = proxyquire('../../../../frontend/components/site/PagesHeader', {
  './icons': {
    IconView: 'IconView',
  },
}).default;

describe('<PagesHeader />', () => {
  const goodProps = {
    owner: 'test-owner',
    repository: 'test-repo',
    title: 'Page Title',
    viewLink: 'https://view.example.gov',
  };

  it('renders', () => {
    const wrapper = shallow(<PagesHeader {...goodProps} />);
    expect(wrapper.exists()).to.be.true;
  });
});
