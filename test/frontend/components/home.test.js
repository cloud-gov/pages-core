import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const Home = proxyquire('../../../frontend/components/home', {
  './home.html': '🏚',
}).default;

describe('<Home/>', () => {
  beforeEach(() => {
    global.window = {
      location: { search: '' },
    };
  });

  it('renders properly', () => {
    const wrapper = shallow(<Home />);
    expect(wrapper.find('main.container')).to.have.length(1);
    expect(wrapper.find('.usa-alert-home')).to.have.length(0);
  });

  it('renders an error when login_failed param in query string', () => {
    global.window.location.search = '?login_failed=yup';
    const wrapper = shallow(<Home />);
    expect(wrapper.find('.usa-alert-home')).to.have.length(1);
  });
});
