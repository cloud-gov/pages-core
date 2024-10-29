import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { AddUserForm } from '../../../../frontend/components/organization/AddUserForm';

describe('<AddUserForm />', () => {
  it('renders', () => {
    const props = {
      handleSubmit: () => Promise.resolve(),
      roleOptions: [
        {
          label: 'role1',
          value: 1,
        },
        {
          label: 'role2',
          value: 2,
        },
      ],
      invalid: true,
      pristine: true,
      reset: () => {},
      submitting: false,
    };

    const wrapper = shallow(<AddUserForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
