import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { SiteBuildLogs, REFRESH_INTERVAL } from '../../../../frontend/components/site/siteBuildLogs';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

let props;

describe('<SiteBuildLogs/>', () => {
  beforeEach(() => {
    props = {
      buildId: '123',
      buildLogs: {
        isLoading: false,
        data: [{
          id: 1, source: 'theSource', createdAt: '2018-11-05T13:15:30Z', output: 'blahblah',
        }],
      },
      actions: { fetchBuildLogs: sinon.spy() },
    };
  });

  it('should render a button to download logs if builds exist', () => {
    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(1);
    expect(wrapper.find('p')).to.have.length(0);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.false;
    expect(wrapper.find('RefreshBuildLogsButton')).to.have.length(1);
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(1);
  });

  it('should render a loading state if builds are loading', () => {
    props.buildLogs.isLoading = true;
    props.buildLogs.data = [];

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no builds', () => {
    props.buildLogs.isLoading = false;
    props.buildLogs.data = [];

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.true;
    expect(wrapper.find('RefreshBuildLogsButton')).to.have.length(1);
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(0);
  });

  it('should fetch the builds on mount', () => {
    const spy = sinon.spy();

    props.actions = { fetchBuildLogs: spy };

    shallow(<SiteBuildLogs {...props} />);
    expect(spy.calledOnce).to.equal(true);
  });

  describe('Auto Refresh', () => {
    const AUTO_REFRESH_SELECTOR = '[data-test="toggle-auto-refresh"]';

    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should default to auto refresh: OFF', () => {
      const wrapper = shallow(<SiteBuildLogs {...props} />);
      expect(wrapper.state('autoRefresh')).to.equal(false);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: OFF');
    });

    it('should toggle auto refresh when the `auto refresh` button is clicked', () => {
      const wrapper = shallow(<SiteBuildLogs {...props} />);

      wrapper.find(AUTO_REFRESH_SELECTOR).simulate('click');
      expect(wrapper.state('autoRefresh')).to.equal(true);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: ON');

      wrapper.find(AUTO_REFRESH_SELECTOR).simulate('click');
      expect(wrapper.state('autoRefresh')).to.equal(false);
      expect(wrapper.find(AUTO_REFRESH_SELECTOR).text()).to.equal('Auto Refresh: OFF');
    });

    it('should refresh builds according to the refresh interval when `auto refresh` is on', () => {
      const spy = sinon.spy();

      props.actions = { fetchBuildLogs: spy };

      const wrapper = shallow(<SiteBuildLogs {...props} />);
      wrapper.setState({ autoRefresh: true });
      clock.tick(REFRESH_INTERVAL + 1000);
      expect(spy.callCount).to.equal(2);
    });

    it('should NOT refresh builds when `auto refresh` is turned off', () => {
      const spy = sinon.spy();

      props.actions = { fetchBuildLogs: spy };

      shallow(<SiteBuildLogs {...props} />);
      clock.tick(REFRESH_INTERVAL + 1000);
      expect(spy.callCount).to.equal(1);
    });
  });
});
