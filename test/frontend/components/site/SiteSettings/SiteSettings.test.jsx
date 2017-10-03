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

const SiteSettings = proxyquire(
  '../../../../../frontend/components/site/SiteSettings',
  { '../../../actions/siteActions': siteActionsMock }
).default;

describe('<SiteSettings/>', () => {
  const makeProps = () => (
    {
      site: {
        domain: 'https://example.gov',
        defaultBranch: 'master',
        demoBranch: 'demo',
        demoDomain: 'https://demo.example.gov',
        engine: 'jekyll',
      },
    }
  );

  beforeEach(() => {
    siteActionsMock.deleteSite = spy();
    siteActionsMock.updateSite = spy();

    global.window = { confirm: spy() };
  });

  let origWindow;
  before(() => {
    origWindow = global.window;
  });

  after(() => {
    global.window = origWindow;
  });

  it('should render', () => {
    const props = makeProps();
    const wrapper = shallow(<SiteSettings {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('ReduxForm')).to.have.length(2);
  });

  it('should not render if site prop is not defined', () => {
    const props = {};
    const wrapper = shallow(<SiteSettings {...props} />);
    expect(wrapper.get(0)).to.be.null;
  });

  it('can call updateSite action', () => {
    const props = makeProps();
    const wrapper = shallow(<SiteSettings {...props} />);

    expect(siteActionsMock.updateSite.called).to.be.false;
    const newValues = { boop: 'beep' };
    wrapper.instance().onSubmit(newValues);
    expect(siteActionsMock.updateSite.calledOnce).to.be.true;
    expect(siteActionsMock.updateSite.calledWith(props.site, newValues)).to.be.true;
  });

  it('can call deleteSite action', () => {
    global.window = { confirm: () => true };
    const props = makeProps();
    const wrapper = shallow(<SiteSettings {...props} />);

    expect(siteActionsMock.deleteSite.called).to.be.false;
    const mockEvent = { preventDefault: spy() };
    wrapper.instance().onDelete(mockEvent);
    expect(siteActionsMock.deleteSite.calledOnce).to.be.true;
    expect(siteActionsMock.deleteSite.calledWith(props.site.id)).to.be.true;
    expect(mockEvent.preventDefault.calledOnce).to.be.true;
  });
});
