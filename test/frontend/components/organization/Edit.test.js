import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';
import { Edit } from '../../../../frontend/components/organization/Edit';

describe('<Edit />', () => {
  it('shows the loading indicator when data is loading', () => {
    const props = {
      id: '1',
      actions: {
        fetchOrganizationMembers: () => Promise.resolve(),
        fetchOrganization: () => Promise.resolve(),
        fetchRoles: () => Promise.resolve(),
        inviteToOrganization: () => Promise.resolve(),
        removeOrganizationRole: () => Promise.resolve(),
        updateOrganization: () => Promise.resolve(),
        updateOrganizationRole: () => Promise.resolve(),
      },
    };

    const wrapper = shallow(<Edit {...props} />);

    expect(wrapper.contains(<LoadingIndicator />)).to.be.true;
  });
});
