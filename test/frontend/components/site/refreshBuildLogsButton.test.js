import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const fetchBuildLogs = spy();

const RefreshBuildLogsButton = proxyquire('../../../../frontend/components/site/refreshBuildLogsButton', {
  '../../actions/buildLogActions': { fetchBuildLogs },
}).default;

describe('<RefreshBuildLogsButton />', () => {
  it('renders correctly', () => {
    const wrapper = shallow(<RefreshBuildLogsButton buildId={123} />);
    expect(wrapper.find('button')).to.have.length(1);
    expect(wrapper.find('button').contains('Refresh logs')).to.be.true;
  });

  it('dispatches an action to fetch build logs when clicked', () => {
    const wrapper = shallow(<RefreshBuildLogsButton buildId={456} />);
    const button = wrapper.find('button');
    expect(fetchBuildLogs.calledOnce).to.be.false;
    button.simulate('click');
    expect(fetchBuildLogs.calledOnce).to.be.true;
    expect(fetchBuildLogs.calledWith({ id: 456 })).to.be.true;
  });
});
