import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import LoadingIndicator from '../../../../frontend/components/LoadingIndicator';

proxyquire.noCallThru();

const useSelectorStub = sinon.stub().returns({ id: 1 });

const { Edit } = proxyquire('../../../../frontend/components/organization/Edit', {
  'react-redux': {
    useSelector: useSelectorStub,
  },
});

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
        updateOrganizationRole: () => Promise.resolve(),
      },
    };

    const wrapper = shallow(<Edit {...props} />);

    expect(wrapper.contains(<LoadingIndicator />)).to.be.true;
  });
});
