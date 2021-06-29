import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { RemoveUserForm } from '../../../../frontend/components/organization/RemoveUserForm';

describe('<RemoveUserForm />', () => {
  it('renders', () => {
    const props = {
      handleSubmit: () => Promise.resolve(),
      submitting: false,
    };

    const wrapper = shallow(<RemoveUserForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
