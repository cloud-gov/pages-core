import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import { UserActionsTable } from '../../../../frontend/components/site/UserActionsTable';

const fetchUserActions = spy();

describe('<UserActionsTable/>', () => {
  afterEach(() => fetchUserActions.resetHistory());

  it('should render nothing if the current user has no actions', () => {
    const wrapper = shallow(<UserActionsTable site={1} fetchUserActions={fetchUserActions} />);

    expect(wrapper.find('table')).to.have.length(0);
  });

  it('calls fetchUserActions on mount', () => {
    shallow(<UserActionsTable site={22} fetchUserActions={fetchUserActions} />);
    expect(fetchUserActions.calledOnce).to.be.true;
    expect(fetchUserActions.calledWith(22)).to.be.true;
  });

  it('should render a table of user actions', () => {
    const props = {
      fetchUserActions,
      site: 1,
      userActions: [
        {
          initiator: { username: 'test_user1' },
          targetType: 'user',
          actionType: { action: 'remove' },
          actionTarget: { username: 'test_user_1' },
          createdAt: '2017-06-19T14:50:44.336Z',
        },
        {
          initiator: { username: 'test_user1' },
          targetType: 'user',
          actionType: { action: 'remove' },
          actionTarget: { username: 'test_user_2' },
          createdAt: '2018-01-02T21:45:00.000+05:00', // with +5 offset
        },
      ],
    };
    const wrapper = shallow(<UserActionsTable {...props} />);
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('th').at(0).contains('Initiator')).to.be.true;
    expect(wrapper.find('th').at(1).contains('Action')).to.be.true;
    expect(wrapper.find('th').at(2).contains('Target')).to.be.true;
    expect(wrapper.find('th').at(3).contains('Timestamp (UTC)')).to.be.true;

    const rows = wrapper.find('tbody tr');
    expect(rows).to.have.length(2);

    const row1 = rows.at(0);
    expect(row1.find('td').at(0).contains('test_user1')).to.be.true;
    expect(row1.find('td').at(1).contains('remove')).to.be.true;
    expect(row1.find('td').at(2).contains('test_user_1')).to.be.true;
    expect(row1.find('td').at(3).contains('2017-06-19 14:50:44')).to.be.true;

    const row2 = rows.at(1);
    expect(row2.find('td').at(0).contains('test_user1')).to.be.true;
    expect(row2.find('td').at(1).contains('remove')).to.be.true;
    expect(row2.find('td').at(2).contains('test_user_2')).to.be.true;

    // this time is 5 hours "earlier" than the specified createdAt due to the UTC offset of +5
    expect(row2.find('td').at(3).contains('2018-01-02 16:45:00')).to.be.true;
  });
});
