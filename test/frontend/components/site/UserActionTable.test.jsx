import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import UserActionsTable from '../../../../frontend/components/site/UserActionsTable';

const userActions = [{
  actionTarget: {
    id: 2,
    username: 'fake-person-a',
    email: null,
    createdAt: '2017-12-26T14:06:51.669Z',
  },
  actionType: { action: 'remove' },
  createdAt: '2017-12-26T00:00:00.000Z',
  id: 2,
  targetType: 'user',
},
{
  actionTarget: {
    id: 2,
    username: 'fake-person-b',
    email: null,
    createdAt: '2017-12-26T14:06:51.669Z',
  },
  actionType: { action: 'remove' },
  createdAt: '2017-12-29T00:00:00.000Z',
  id: 2,
  targetType: 'user',
}];

describe('<UserActionsTable />', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<UserActionsTable userActions={userActions} />);
  });

  it('renders a table', () => {
    expect(wrapper.find('table')).to.have.length(1);
  });

  it('renders a row for each action', () => {
    expect(wrapper.find('table tbody').find('tr')).to.have.length(2);
  });

  it('renders the actions from most recent to least recent', () => {
    const tableRows = wrapper.find('table tbody').find('tr');
    const expectedFirstUser = userActions[1].actionTarget.username;

    expect(tableRows.first().contains(expectedFirstUser));
  });
});
