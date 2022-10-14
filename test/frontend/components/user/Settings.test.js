import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import { buildInitialValues, Settings } from '../../../../frontend/components/user/Settings';

function getProps({
  organizations, sites, user, actions: {
    error, success, updateUserSettings, userSettingsUpdated,
  } = {},
} = { actions: {} }) {
  return {
    organizations: organizations ?? { isLoading: false, data: [] },
    sites: sites ?? { isLoading: false, data: [] },
    user: user ?? {},
    actions: {
      error: error ?? sinon.stub(),
      success: success ?? sinon.stub(),
      updateUserSettings: updateUserSettings ?? sinon.stub().resolves(),
      userSettingsUpdated: userSettingsUpdated ?? sinon.stub(),
    },
  };
}

describe('buildInitialValues()', () => {
  it('merges existing build notification values with default values for all user sites', () => {
    const sites = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const user = {
      buildNotificationSettings: {
        2: 'builds',
      },
    };

    const defaultValue = 'site';

    const initialValues = buildInitialValues(sites, user);

    expect(initialValues).to.deep.eq({
      buildNotificationSettings: {
        1: defaultValue,
        2: 'builds',
        3: defaultValue,
      },
    });
  });
});

describe('<Settings />', () => {
  afterEach(() => sinon.restore());

  it('shows the loading indicator when sites data is loading', () => {
    const props = getProps({ sites: { isLoading: true } });

    const wrapper = shallow(<Settings {...props} />);

    expect(wrapper.contains(<LoadingIndicator />)).to.be.true;
  });

  it('shows the loading indicator when organizations data is loading', () => {
    const props = getProps({ organizations: { isLoading: true } });

    const wrapper = shallow(<Settings {...props} />);

    expect(wrapper.contains(<LoadingIndicator />)).to.be.true;
  });

  it('shows the user settings and build notifications when data is done loading', () => {
    const props = getProps();

    const wrapper = shallow(<Settings {...props} />);

    expect(wrapper.contains(<h1>User Settings</h1>)).to.be.true;
    expect(wrapper.contains(<h3>Build Notifications</h3>)).to.be.true;
    expect(wrapper.contains(<h3>Github Token</h3>)).to.be.true;
  });
});
