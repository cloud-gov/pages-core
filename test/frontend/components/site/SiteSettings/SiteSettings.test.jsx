import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const siteActionsMock = {
  deleteSite: spy(),
  updateSite: spy(),
};

const { SiteSettings } = proxyquire(
  '../../../../../frontend/components/site/SiteSettings',
  { '../../../actions/siteActions': siteActionsMock }
);

describe('<SiteSettings/>', () => {
  const props = {
    site: {
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
    organization: {
      id: 1,
      name: 'org-1',
    }
  };

  let origWindow;
  let wrapper;

  before(() => {
    origWindow = global.window;
  });

  beforeEach(() => {
    siteActionsMock.deleteSite = spy();
    siteActionsMock.updateSite = spy();

    global.window = { confirm: spy() };
    wrapper = shallow(<SiteSettings {...props} />);
  });

  after(() => {
    global.window = origWindow;
  });

  it('should render', () => {
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('AdvancedSiteSettings')).to.have.length(1);
    expect(wrapper.find('ExpandableArea')).to.have.length(2);
  });

  it('should not render BasicSettings if sandbox org', () => {
    wrapper = shallow(<SiteSettings  { ...{...props, organization: { isSandbox: true } } }/>);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('BasicSiteSettings')).to.have.length(0);
    expect(wrapper.find('AdvancedSiteSettings')).to.have.length(1);
    expect(wrapper.find('ExpandableArea')).to.have.length(3);
  });

  it('should not render if site prop is not defined', () => {
    const formlessWrapper = shallow(<SiteSettings {...{}} />);
    expect(formlessWrapper.get(0)).to.be.null;
  });

  it('can call updateSite action', () => {
    expect(siteActionsMock.updateSite.called).to.be.false;
    const newValues = { boop: 'beep' };
    wrapper.instance().handleUpdate(newValues);
    expect(siteActionsMock.updateSite.calledOnce).to.be.true;
    expect(siteActionsMock.updateSite.calledWith(props.site, newValues)).to.be.true;
  });

  it('can call deleteSite action', () => {
    global.window = { confirm: () => true };

    expect(siteActionsMock.deleteSite.called).to.be.false;
    wrapper.instance().handleDelete();
    expect(siteActionsMock.deleteSite.calledOnce).to.be.true;
    expect(siteActionsMock.deleteSite.calledWith(props.site.id)).to.be.true;
  });
});
