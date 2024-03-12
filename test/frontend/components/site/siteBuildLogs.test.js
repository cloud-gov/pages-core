import React from 'react';
import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import api from '../../../../frontend/util/federalistApi';
import { SiteBuildLogs } from '../../../../frontend/components/site/siteBuildLogs';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

let props;

// Initial work for when the containing .skip can be removed
const defaultBuild = {
  site: {
    owner: 'user',
    repository: 'repo',
  },
  branch: 'branch',
  username: 'username',
  clonedCommitSha: 'sha4567890abcdef',
  createdAt: new Date(),
};

describe.skip('<SiteBuildLogs/>', () => {
  beforeEach(() => {
    props = {
      buildId: '123',
      buildDetails: defaultBuild,
      isLoading: false,
      logs: [],
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  // For when the containing .skip can be removed
  it('should exist', () => {
    assert.isDefined(SiteBuildLogs);
  });

  // Placeholder for when the containing .skip can be removed
  it('requests build information once on load', () => {
    // Verify that fetchBuild is called once
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

  // Placeholder for when the containing .skip can be removed
  it('should render an explanatory message if the build is over 180 days old', () => {
    const stubBuild = { completedAt: new Date(Date.now() - (181 * 86400000)) }; // 181 days ago
    const stub = sinon.stub(api, 'fetchBuild');
    stub.resolves(stubBuild);

    props.buildLogs.isLoading = false;
    props.buildLogs.data = [];

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find('p').contains('Builds more than 180 days old are deleted according to platform policy.')).to.be.true;
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(0);
  });

  it('should render an empty state if there are no builds', () => {
    props.buildLogs.isLoading = false;
    props.buildLogs.data = [];

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.true;
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(0);
  });

  it('should fetch the build logs on mount', () => {
    const spy = sinon.spy();

    props.actions = { fetchBuildLogs: spy };

    shallow(<SiteBuildLogs {...props} />);
    expect(spy.calledOnce).to.equal(true);
  });
});
