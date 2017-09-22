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
        users: [],
      },
    };
    const wrapper = shallow(<SiteUsers {...props} />);
    expect(wrapper.find('table')).to.have.length(1);
  });

  it('renders rows of users in order of username', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
        users: [
          { id: 3, email: 'zboop@beep.gov', username: 'Zuser' },
          { id: 4, email: 'test-owner@beep.gov', username: 'test-owner' },
          { id: 1, email: 'aboop@beep.gov', username: 'Auser' },
        ],
      },
    };

    const wrapper = shallow(<SiteUsers {...props} />);
    expect(wrapper.find('table')).to.have.length(1);

    const rows = wrapper.find('tbody tr');
    expect(rows).to.have.length(3);

    const expectedOrder = ['Auser', 'test-owner', 'Zuser'];
    rows.forEach((row, i) => {
      expect(row.find('a').prop('href')).to.equal(
        `https://github.com/${expectedOrder[i]}`
      );
    });
  });

  it('notes the site repository owner', () => {
    const props = {
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
        users: [
          { id: 1, email: 'not-owner@beep.gov', username: 'not-owner' },
          { id: 2, email: 'owner@beep.gov', username: 'test-owner' },
        ],
      },
    };

    const wrapper = shallow(<SiteUsers {...props} />);
    const rows = wrapper.find('tbody tr');
    expect(rows).to.have.length(2);
    expect(rows.at(0).find('td').contains('(owner)')).to.be.false;
    expect(rows.at(1).find('td').contains('(owner)')).to.be.true;
  });
});
