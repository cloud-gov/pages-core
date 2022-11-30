import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { SiteBuildLogs } from '../../../../frontend/components/site/siteBuildLogs';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

let props;

describe.skip('<SiteBuildLogs/>', () => {
  beforeEach(() => {
    props = {
      buildId: '123'
    };
  });

  it('should render a button to download logs if builds exist', () => {
    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(1);
    expect(wrapper.find('p')).to.have.length(0);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.false;
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
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(0);
  });

  it('should fetch the builds on mount', () => {
    const spy = sinon.spy();

    props.actions = { fetchBuildLogs: spy };

    shallow(<SiteBuildLogs {...props} />);
    expect(spy.calledOnce).to.equal(true);
  });
});
