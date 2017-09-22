import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SiteUsers from '../../../../frontend/components/site/SiteUsers';

describe('<SiteUsers/>', () => {
  it('should render', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
        users: [
          { id: 1, email: 'boop1@beep.gov', username: 'user1' },
          { id: 2, email: 'boop2@beep.gov', username: 'user2' },
          { id: 3, email: 'zboop@beep.gov', username: 'Zuser' },
          { id: 4, email: 'boop4@beep.gov', username: 'user4' },
        ],
      },
    };

    const wrapper = shallow(<SiteUsers {...props} />);
    console.log("------->")
    console.log(wrapper);
    expect(wrapper.find('table')).to.have.length(1);
    props.site.users.forEach((u) => {
      expect(wrapper.find(`tr key=${u.username}`)).to.have.length(1);
    });
  });
});
