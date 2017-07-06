import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const fetchBuilds = spy();

const RefreshBuildsButton = proxyquire('../../../../frontend/components/site/refreshBuildsButton', {
  '../../actions/buildActions': { fetchBuilds },
}).default;

describe('<RefreshBuildsButton />', () => {
  it('renders correctly', () => {
    const wrapper = shallow(<RefreshBuildsButton site={{ id: 123 }} />);
    expect(wrapper.find('button')).to.have.length(1);
    expect(wrapper.find('button').contains('Refresh builds')).to.be.true;
  });

  it('dispatches an action to fetch build logs when clicked', () => {
    const wrapper = shallow(<RefreshBuildsButton site={{ id: 456 }} />);
    const button = wrapper.find('button');
    expect(fetchBuilds.calledOnce).to.be.false;
    button.simulate('click');
    expect(fetchBuilds.calledOnce).to.be.true;
    expect(fetchBuilds.calledWith({ id: 456 })).to.be.true;
  });
});
