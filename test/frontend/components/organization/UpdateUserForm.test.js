import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { UpdateUserForm } from '../../../../frontend/components/organization/UpdateUserForm';

describe('<UpdateUserForm />', () => {
  it('renders', () => {
    const props = {
      initialValues: {
        roleId: 1,
      },
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
      submitting: false,
    };

    const wrapper = shallow(<UpdateUserForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
