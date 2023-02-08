import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

import { mountRouter } from '../../../support/_mount';

proxyquire.noCallThru();

const siteActionsMock = {
  deleteSite: spy(),
  updateSite: spy(),
};

const { SiteSettings } = proxyquire(
  '../../../../../frontend/components/site/SiteSettings',
  {
    '../../../actions/siteActions': siteActionsMock,
    './EnvironmentVariables': () => <div />,
  }
);

describe('<SiteSettings/>', () => {
  const state = {
    sites: {
      data: [
        {
          id: 1,
          owner: 'el-mapache',
          repository: 'federalist-modern-team-template',
          domain: 'https://example.gov',
          defaultBranch: 'main',
          demoBranch: 'demo',
          demoDomain: 'https://demo.example.gov',
          engine: 'jekyll',
          basicAuth: {},
          organizationId: 1,
        },
      ],
    },
    organizations: {
      data: [
        {
          id: 1,
          name: 'org-1',
        },
      ],
    },
  };

  let origWindow;
  let wrapper;

  before(() => {
    origWindow = global.window;
  });

  beforeEach(() => {
    wrapper = mountRouter(<SiteSettings />, '/sites/:id/settings', '/sites/1/settings', state);
  });

  after(() => {
    global.window = origWindow;
  });

  it('should render', () => {
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('[title="Advanced settings"]')).to.have.length(1);
    expect(wrapper.find('ExpandableArea')).to.have.length(2);
  });
});
