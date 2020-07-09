import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import BasicAuthSettings from '../../../../../frontend/components/site/SiteSettings/BasicAuthSettings';

const stubs = {};

const siteId = 1;

describe('<BasicAuthSettings />', () => {
  let defaultProps;

  beforeEach(() => {
    stubs.fetchBasicAuth = sinon.stub();
    stubs.saveBasicAuth = sinon.stub();
    stubs.removeBasicAuth = sinon.stub();
    defaultProps = {
      siteId,
      basicAuth: { isLoading: false, data: {} },
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

  it('fetches uevs on mount', () => {
    shallow(<BasicAuthSettings {...defaultProps} />);
    sinon.assert.calledWith(stubs.fetchBasicAuth, siteId);
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

  describe('when loading', () => {
    let props;

    beforeEach(() => {
      props = { ...defaultProps, basicAuth: { isLoading: true, data: {} } };
    });

    it('renders a loading spinner', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(1);
    });

    it('does not render the "new environment variable" section or form', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(0);
      expect(wrapper.find('ReduxForm')).to.have.lengthOf(0);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(0);
    });
  });

  describe('when not loading with no basicAuth credentials', () => {
    let props;

    beforeEach(() => {
      props = { ...defaultProps, basicAuth: { isLoading: false, data: {} } };
    });

    it('does not render a loading spinner', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(0);
    });

    it('does not render the "new environment variable" section or form', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(1);
      expect(wrapper.find('ReduxForm')).to.have.lengthOf(1);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(1);
    });
  });

  describe('when not loading with credentials', () => {
    const credentials = { username: 'username', password: 'password' };

    let props;

    beforeEach(() => {
      props = { ...defaultProps, basicAuth: { isLoading: false, data: credentials } };
    });

    it('does not render a loading spinner', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(0);
    });

    it('does not render the "new environment variable" section or form', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(0);
      expect(wrapper.find('ReduxForm')).to.have.lengthOf(0);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      expect(wrapper.find('BasicAuthSettingsForm')).to.have.lengthOf(0);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<BasicAuthSettings {...props} />);
      const submitButton = wrapper.find('button[type="submit",name="disable-basic-auth"]');
      expect(submitButton).to.have.lengthOf(1);
      expect(submitButton.first().prop('disabled')).to.be.false;
      expect(submitButton.first().prop('value')).to.equal('Disable');
    });
    // it('renders the "new environment variable" section', () => {
    //   const wrapper = shallow(<BasicAuthSettings {...props} />);
    //   const section = wrapper.findWhere(n => n.name() === 'ExpandableArea' && n.prop('title') === 'Add a new environment variable');
    //   expect(section).to.have.lengthOf(1);
    // });

    // it('renders the "uev" table', () => {
    //   const wrapper = shallow(<BasicAuthSettings {...props} />);
    //   const table = wrapper.find('EnvironmentVariableTable');
    //   expect(table).to.have.lengthOf(1);
    //   expect(table.first().prop('uevs')).to.eq(props.userEnvironmentVariables.data);

    //   table.first().prop('onDelete')(uev.id);
    //   sinon.assert.calledWith(stubs.deleteUserEnvironmentVariable, siteId, uev.id);
    // });
  });
});
