import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const siteActionsMock = {
  deleteSite: spy(),
  updateSite: spy(),
  addSite: spy(),
};

const SiteSettings = proxyquire(
  '../../../../../frontend/components/site/SiteSettings',
  { '../../../actions/siteActions': siteActionsMock }
).SiteSettings;

describe('<SiteSettings/>', () => {
  const props = {
    site: {
      owner: 'el-mapache',
      repository: 'federalist-modern-team-template',
      domain: 'https://example.gov',
      defaultBranch: 'main',
      demoBranch: 'demo',
      demoDomain: 'https://demo.example.gov',
      engine: 'jekyll',
    },
  };

  let origWindow;
  let wrapper;

  beforeEach(() => {
    siteActionsMock.deleteSite = spy();
    siteActionsMock.updateSite = spy();
    siteActionsMock.addSite = spy();

    global.window = { confirm: spy() };
  });

  before(() => {
    origWindow = global.window;
    wrapper = shallow(<SiteSettings {...props} />);
  });

  after(() => {
    global.window = origWindow;
  });

  it('should render', () => {
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('AdvancedSiteSettings')).to.have.length(1);
    expect(wrapper.find('ReduxForm')).to.have.length(2);
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

  it('calls the addSite action', () => {
    const newValues = {
      newBaseBranch: 'new-branch',
      newRepoName: 'repo-two',
      targetOwner: 'github-user',
    };
    const expectedValues = {
      owner: newValues.targetOwner,
      repository: newValues.newRepoName,
      defaultBranch: newValues.newBaseBranch,
      engine: props.site.engine,
      source: {
        owner: props.site.owner,
        repo: props.site.repository,
      },
    };

    wrapper.instance().handleCopySite(newValues);
    expect(siteActionsMock.addSite.calledOnce).to.be.true;
    expect(siteActionsMock.addSite.calledWith(expectedValues)).to.be.true;
  });
});
