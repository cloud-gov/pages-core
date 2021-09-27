import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { SettingsForm } from '../../../../frontend/components/user/SettingsForm';

describe('<SettingsForm />', () => {
  it('renders', () => {
    const props = {
      initialValues: {
        buildNotificationSettings: {
          1: 'site',
        },
      },
      handleSubmit: () => Promise.resolve(),
      organizations: [],
      sites: [],
      invalid: true,
      pristine: true,
      submitting: false,
    };

    const wrapper = shallow(<SettingsForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
