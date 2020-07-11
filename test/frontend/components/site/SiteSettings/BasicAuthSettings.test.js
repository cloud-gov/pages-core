import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { BasicAuthSettings } from '../../../../../frontend/components/site/SiteSettings/BasicAuthSettings';

const stubs = {};

const siteId = 1;

describe('<BasicAuthSettings />', () => {
  let defaultProps;

  beforeEach(() => {
    stubs.saveBasicAuth = sinon.stub();
    stubs.removeBasicAuth = sinon.stub();
    defaultProps = {
      siteId,
      basicAuth: {},
      actions: {
        fetchBasicAuth: stubs.fetchBasicAuth,
        saveBasicAuth: stubs.saveBasicAuth,
        removeBasicAuth: stubs.removeBasicAuth,
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders successfully', () => {
    const wrapper = shallow(<BasicAuthSettings {...defaultProps} />);
    expect(wrapper.exists()).to.be.true;
  });

  it('renders an informational alert', () => {
    const wrapper = shallow(<BasicAuthSettings {...defaultProps} />);
    const alert = wrapper.findWhere(n => n.name() === 'AlertBanner' && n.prop('status') === 'info');
    expect(alert).to.have.lengthOf(1);
  });

  it('renders a warning alert', () => {
    const wrapper = shallow(<BasicAuthSettings {...defaultProps} />);
    const alert = wrapper.findWhere(n => n.name() === 'AlertBanner' && n.prop('status') === 'warning');
    expect(alert).to.have.lengthOf(1);
  });

  it('does render the "new basic auth credentials form', () => {
    const wrapper = shallow(<BasicAuthSettings {...defaultProps} />);
    expect(wrapper.find('ReduxForm')).to.have.lengthOf(1);
  });

  describe('when not loading with credentials', () => {
    const credentials = { username: 'username', password: 'password' };

    let props;

    beforeEach(() => {
      props = { ...defaultProps, basicAuth: credentials } ;
    });

    it('does not render the basic auth credentials form', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('ReduxForm')).to.have.lengthOf(0);
    });

    it('does render the basic auth credentials disable button', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      const submitButton = wrapper.find('#disable-basic-auth-btn');
      expect(submitButton).to.have.lengthOf(1);
    });
  });
});
