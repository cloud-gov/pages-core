import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import UserActionsTable from '../../../../frontend/components/site/UserActionsTable';

describe('<UserActionsTable/>', () => {
  it('should render nothing if the current user has no actions', () => {
    const wrapper = shallow(<UserActionsTable />);

    expect(wrapper.find('UserActionsTable')).to.have.length(0);
  });

  it('should render a table of user actions', () => {
    const props = {
      userActions: [
        {
          targetType: 'user',
          actionType: { action: 'remove' },
          actionTarget: { username: 'test_user_1' },
          createdAt: '2017-06-19T14:50:44.336Z',
        },
        {
          targetType: 'user',
          actionType: { action: 'remove' },
          actionTarget: { username: 'test_user_2' },
          createdAt: '2018-01-02T21:45:00.000+05:00', // with +5 offset
        },
      ],
    };
    const wrapper = shallow(<UserActionsTable {...props} />);
    expect(wrapper.find('table')).to.have.length(1);
    expect(wrapper.find('th').at(0).contains('Action')).to.be.true;
    expect(wrapper.find('th').at(1).contains('Target')).to.be.true;
    expect(wrapper.find('th').at(2).contains('Timestamp (UTC)')).to.be.true;

    const rows = wrapper.find('tbody tr');
    expect(rows).to.have.length(2);

    const row1 = rows.at(0);
    expect(row1.find('td').at(0).contains('remove')).to.be.true;
    expect(row1.find('td').at(1).contains('test_user_1')).to.be.true;
    expect(row1.find('td').at(2).contains('2017-06-19 14:50:44')).to.be.true;

    const row2 = rows.at(1);
    expect(row2.find('td').at(0).contains('remove')).to.be.true;
    expect(row2.find('td').at(1).contains('test_user_2')).to.be.true;

    // this time is 5 hours "earlier" than the specified createdAt due to the UTC offset of +5
    expect(row2.find('td').at(2).contains('2018-01-02 16:45:00')).to.be.true;
  });
});
