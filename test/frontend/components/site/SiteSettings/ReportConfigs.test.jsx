import React from 'react';
import { expect } from 'chai';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';

import { mountRouter } from '../../../support/_mount';

proxyquire.noCallThru();

const notificationActions = {
  deleteSite: spy(),
  updateSite: spy(),
};

const useSiteBuildTasks = stub();
const useDefaultScanRules = stub();

const { ReportConfigs } = proxyquire(
  '../../../../../frontend/components/site/SiteSettings/ReportConfigs',
  {
    '../../../actions/notificationActions': notificationActions,
    '../../../hooks/useSiteBuildTasks': { useSiteBuildTasks },
    '../../../hooks/useDefaultScanRules': {
      useDefaultScanRules,
    },
    '../../icons': {
      IconTrash: () => <div />,
      IconExternalLink: () => <div />,
    },
  },
);

describe('<ReportConfigs/>', () => {
  const state = {};

  let wrapper;

  beforeEach(() => {
    useSiteBuildTasks.returns({
      isLoading: false,
      siteBuildTasks: [],
    });
    useDefaultScanRules.returns({
      isLoading: false,
      defaultScanRules: [],
    });
  });

  it('should render', () => {
    wrapper = mountRouter(
      <ReportConfigs siteId={1} />,
      '/sites/:id/settings',
      '/sites/1/settings',
      state,
    );

    expect(wrapper.exists()).to.be.true;
  });

  it('should render default rules', () => {
    useSiteBuildTasks.returns({
      isLoading: false,
      siteBuildTasks: [
        {
          id: 'owasp-zap',
          sbtId: 1,
          metadata: {},
          branch: 'main',
          name: 'ZAP',
          description: '',
        },
      ],
    });
    useDefaultScanRules.returns({
      isLoading: false,
      defaultScanRules: [
        {
          id: '10063',
          source: 'Pages',
          type: 'owasp-zap',
        },
      ],
    });

    wrapper = mountRouter(
      <ReportConfigs siteId={1} />,
      '/sites/:id/settings',
      '/sites/1/settings',
      state,
    );

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('b#rule-10063')).to.exist;
  });

  it('should handle rules with matches', () => {
    useSiteBuildTasks.returns({
      isLoading: false,
      siteBuildTasks: [
        {
          id: 'owasp-zap',
          sbtId: 1,
          metadata: {
            rules: [
              {
                id: '10063',
                source: 'Pages',
                type: 'owasp-zap',
                match: ['an', 'array'],
              },
            ],
          },
          branch: 'main',
          name: 'ZAP',
          description: '',
        },
      ],
    });

    wrapper = mountRouter(
      <ReportConfigs siteId={1} />,
      '/sites/:id/settings',
      '/sites/1/settings',
      state,
    );

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('b#rule-10063')).to.exist;
  });
});
