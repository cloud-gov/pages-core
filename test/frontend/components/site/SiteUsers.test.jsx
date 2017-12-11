import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { stub } from 'sinon';
import SiteUsers from '../../../../frontend/components/site/SiteUsers';
import siteActions from '../../../../frontend/actions/siteActions';


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

  describe('rendered table', () => {
    const props = {
      user: {
        username: 'test-owner',
        id: 4,
        email: 'owner@beep.gov',
      },
      site: {
        owner: 'test-owner',
        repository: 'test-repo',
        users: [
          { id: 1, email: 'not-owner@beep.gov', username: 'not-owner' },
          { id: 2, email: 'owner@beep.gov', username: 'test-owner' },
        ],
      },
    };

    let wrapper;

    beforeEach(() => {
      wrapper = shallow(<SiteUsers {...props} />);
    });

    it('renders rows of users in order of username', () => {
      const { users } = props.site;

      expect(wrapper.find('table')).to.have.length(1);

      const rows = wrapper.find('tbody tr');
      expect(rows).to.have.length(users.length);

      const expectedOrder = users.map(u => u.username);
      rows.forEach((row, i) => {
        expect(row.find('a').prop('href')).to.equal(
          `https://github.com/${expectedOrder[i]}`
        );
      });
    });

    it('notes the current user as "you"', () => {
      const rows = wrapper.find('tbody tr');
      expect(rows).to.have.length(2);
      expect(rows.at(0).find('td').contains('(you)')).to.be.false;
      expect(rows.at(1).find('td').contains('(you)')).to.be.true;
    });

    it('should render an `actions` column for each user', () => {
      wrapper = shallow(<SiteUsers {...props} />);
      const rows = wrapper.find('tbody tr');
      rows.forEach(row => expect(row.find('td')).to.have.length(2));
    });

    it('should render a `Remove user` link in each action column', () => {
      const clickSpy = stub(siteActions, 'removeUserFromSite');
      wrapper = shallow(<SiteUsers {...props} />);
      const rows = wrapper.find('tbody tr');

      rows.forEach((row) => {
        const removeUserLink = row.find('td').last().find('ButtonLink').shallow();

        removeUserLink.simulate('click', { preventDefault: () => ({}) });

        expect(clickSpy.called).to.be.true;
        expect(removeUserLink.exists()).to.be.true;
        expect(removeUserLink.contains('Remove user')).to.be.true;
      });
    });
  });
});
