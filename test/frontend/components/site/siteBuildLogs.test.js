import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import { SiteBuildLogs } from '../../../../frontend/components/site/siteBuildLogs';
import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

describe('<SiteBuildLogs/>', () => {
  it('should render a button to download logs if builds exist', () => {
    const props = {
      params: {
        buildId: '123',
      },
      buildLogs: {
        isLoading: false,
        data: [{ source: 'theSource', createdAt: '2018-01-01', output: 'blahblah' }],
      },
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(1);
    expect(wrapper.find('p')).to.have.length(0);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.false;
    expect(wrapper.find('RefreshBuildLogsButton')).to.have.length(1);
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(1);
  });

  it('should render a loading state if builds are loading', () => {
    const props = {
      params: {
        buildId: '123',
      },
      buildLogs: {
        isLoading: true,
        data: [],
      },
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find(LoadingIndicator)).to.have.length(1);
  });

  it('should render an empty state if there are no builds', () => {
    const props = {
      params: {
        buildId: '123',
      },
      buildLogs: {
        data: [],
        isLoading: false,
      },
    };

    const wrapper = shallow(<SiteBuildLogs {...props} />);
    expect(wrapper.find('SiteBuildLogTable')).to.have.length(0);
    expect(wrapper.find('p')).to.have.length(1);
    expect(wrapper.find('p').contains('This build does not have any build logs.')).to.be.true;
    expect(wrapper.find('RefreshBuildLogsButton')).to.have.length(1);
    expect(wrapper.find('DownloadBuildLogsButton')).to.have.length(0);
  });
});
