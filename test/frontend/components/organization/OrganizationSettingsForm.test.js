import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { OrganizationSettingsForm } from '../../../../frontend/components/organization/OrganizationSettingsForm';

describe('<OrganizationSettingsForm/>', () => {
  it('renders', () => {
    const props = {
      initialValues: { name: 'orgName ' },
      handleSubmit: () => Promise.resolve(),
      invalid: true,
      pristine: true,
      reset: () => {},
      submitting: false,
    };

    const wrapper = shallow(<OrganizationSettingsForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
