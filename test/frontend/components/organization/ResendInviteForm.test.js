import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { ResendInviteForm } from '../../../../frontend/components/organization/ResendInviteForm';

describe('<ResendInviteForm />', () => {
  it('renders', () => {
    const props = {
      handleSubmit: () => Promise.resolve(),
      submitting: false,
    };

    const wrapper = shallow(<ResendInviteForm {...props} />);

    expect(wrapper.find('form')).to.have.lengthOf(1);
  });
});
