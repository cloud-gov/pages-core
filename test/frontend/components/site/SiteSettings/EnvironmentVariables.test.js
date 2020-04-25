import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import EnvironmentVariables from '../../../../../frontend/components/site/SiteSettings/EnvironmentVariables';

const stubs = {};

const siteId = 1;

describe.only('<EnvironmentVariableTable/>', () => {
  let wrapper;

  beforeEach(() => {
    stubs.fetchUserEnvironmentVariables = sinon.stub();
    stubs.addUserEnvironmentVariable = sinon.stub();
    stubs.deleteUserEnvironmentVariable = sinon.stub();
    const props = {
      siteId,
      userEnvironmentVariables: { isLoading: false, data: [] },
      actions: {
        fetchUserEnvironmentVariables: stubs.fetchUserEnvironmentVariables,
        addUserEnvironmentVariable: stubs.addUserEnvironmentVariable,
        deleteUserEnvironmentVariable: stubs.deleteUserEnvironmentVariable,
      },
    };
    wrapper = shallow(<EnvironmentVariables {...props} />);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders successfully', () => {
    expect(wrapper.exists()).to.be.true;
  });

  it('fetches uevs on mount', () => {

  });

  it('renders an informational alert', () => {
  });

  it('renders a warning alert', () => {
  });

  describe('when loading', () => {
    it('renders a loading spinner', () => {

    });

    it('does not render the "new environment variable" section', () => {

    });

    it('does not render the "uev" table', () => {

    });
  });

  describe('when not loading with no uevs', () => {
    it('renders the "new environment variable" section', () => {

    });

    it('does not render the "uev" table', () => {

    });
  });

  describe('when not loading with uevs', () => {
    it('renders the "new environment variable" section', () => {

    });

    it('renders the "uev" table', () => {

    });
  });
});
