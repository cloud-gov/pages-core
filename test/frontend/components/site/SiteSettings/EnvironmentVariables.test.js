import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { EnvironmentVariables } from '../../../../../frontend/components/site/SiteSettings/EnvironmentVariables';

const proxyquire = require('proxyquire').noCallThru();

const stubs = {};

const siteId = 1;

describe('<EnvironmentVariables/>', () => {
  let defaultProps;

  beforeEach(() => {
    stubs.fetchUserEnvironmentVariables = sinon.stub();
    stubs.addUserEnvironmentVariable = sinon.stub();
    stubs.deleteUserEnvironmentVariable = sinon.stub();
    defaultProps = {
      siteId,
      userEnvironmentVariables: { isLoading: false, data: [] },
      actions: {
        fetchUserEnvironmentVariables: stubs.fetchUserEnvironmentVariables,
        addUserEnvironmentVariable: stubs.addUserEnvironmentVariable,
        deleteUserEnvironmentVariable: stubs.deleteUserEnvironmentVariable,
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders successfully', () => {
    const wrapper = shallow(<EnvironmentVariables {...defaultProps} />);
    expect(wrapper.exists()).to.be.true;
  });

  it('fetches uevs on mount', () => {
    shallow(<EnvironmentVariables {...defaultProps} />);
    sinon.assert.calledWith(stubs.fetchUserEnvironmentVariables, siteId);
  });

  it('renders an informational alert', () => {
    const wrapper = shallow(<EnvironmentVariables {...defaultProps} />);
    const alert = wrapper.findWhere(n => n.name() === 'AlertBanner' && n.prop('status') === 'info');
    expect(alert).to.have.lengthOf(1);
  });

  it('renders a warning alert', () => {
    const wrapper = shallow(<EnvironmentVariables {...defaultProps} />);
    const alert = wrapper.findWhere(n => n.name() === 'AlertBanner' && n.prop('status') === 'warning');
    expect(alert).to.have.lengthOf(1);
  });

  it('warning contains FISMA Moderate on Pages', () => {
    const { EnvironmentVariables: PagesEnvironmentVariables } = proxyquire(
      '../../../../../frontend/components/site/SiteSettings/EnvironmentVariables',
      { '../../../globals': { PRODUCT: "pages" }}
    );

    const wrapper = shallow(<PagesEnvironmentVariables {...defaultProps} />);
    const alert = wrapper.findWhere(n => n.name() === 'AlertBanner' && n.prop('status') === 'warning');

    expect(alert.render().text()).to.contain('FISMA Moderate')
  });

  describe('when loading', () => {
    let props;

    beforeEach(() => {
      props = { ...defaultProps, userEnvironmentVariables: { isLoading: true, data: [] } };
    });

    it('renders a loading spinner', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(1);
    });

    it('does not render the "new environment variable" section or form', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('EnvironmentVariableForm')).to.have.lengthOf(0);
      expect(wrapper.find('ReduxForm')).to.have.lengthOf(0);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('EnvironmentVariableTable')).to.have.lengthOf(0);
    });
  });

  describe('when not loading with no uevs', () => {
    let props;

    beforeEach(() => {
      props = { ...defaultProps, userEnvironmentVariables: { isLoading: false, data: [] } };
    });

    it('does not render a loading spinner', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(0);
    });

    it('renders the "new environment variable" section', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      const section = wrapper.findWhere(n => n.name() === 'ExpandableArea' && n.prop('title') === 'Add a new environment variable');
      expect(section).to.have.lengthOf(1);
    });

    it('does not render the "uev" table', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('EnvironmentVariableTable')).to.have.lengthOf(0);
    });
  });

  describe('when not loading with uevs', () => {
    const uev = { id: 1, name: 'name', hint: '1234' };

    let props;

    beforeEach(() => {
      props = { ...defaultProps, userEnvironmentVariables: { isLoading: false, data: [uev] } };
    });

    it('does not render a loading spinner', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      expect(wrapper.find('LoadingIndicator')).to.have.lengthOf(0);
    });

    it('renders the "new environment variable" section', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      const section = wrapper.findWhere(n => n.name() === 'ExpandableArea' && n.prop('title') === 'Add a new environment variable');
      expect(section).to.have.lengthOf(1);
    });

    it('renders the "uev" table', () => {
      const wrapper = shallow(<EnvironmentVariables {...props} />);
      const table = wrapper.find('EnvironmentVariableTable');
      expect(table).to.have.lengthOf(1);
      expect(table.first().prop('uevs')).to.eq(props.userEnvironmentVariables.data);

      table.first().prop('onDelete')(uev.id);
      sinon.assert.calledWith(stubs.deleteUserEnvironmentVariable, siteId, uev.id);
    });
  });
});
