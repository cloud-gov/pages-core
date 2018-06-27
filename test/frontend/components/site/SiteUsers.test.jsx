import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

import siteActions from '../../../../frontend/actions/siteActions';

proxyquire.noCallThru();

const { SiteUsers } = proxyquire('../../../../frontend/components/site/SiteUsers', {
  '../icons': { IconGitHub: 'IconGitHub' },
});

const user = {
  username: 'not-owner',
  id: 4,
  email: 'not-owner@beep.gov',
};
const props = {
  user,
  site: {
    owner: 'test-owner',
    repository: 'test-repo',
    users: [
      { id: 1, email: 'not-owner@beep.gov', username: 'not-owner' },
      { id: 2, email: 'owner@beep.gov', username: 'test-owner' },
    ],
  },
};

describe('<SiteUsers/>', () => {
  describe('rendered table', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(<SiteUsers {...props} />);
    });

    it('should render', () => {
      expect(wrapper.find('table')).to.have.length(1);
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
      expect(rows.at(0).find('td').contains(' (you)')).to.be.true;
      expect(rows.at(1).find('td').contains(' (you)')).to.be.false;
    });

    it('should render an `actions` column for each user', () => {
      const rows = wrapper.find('tbody tr');
      rows.forEach(row => expect(row.find('td')).to.have.length(2));
    });

    it('should render a `Remove User` link if the user is not the site owner', () => {
      const rows = wrapper.find('tbody tr');
      expect(rows.at(0).find('td').last().find('ButtonLink')).to.have.length(1);
      expect(rows.at(1).find('td').last().find('ButtonLink')).to.have.length(0);
    });

    it('should call `removeUserFromSite` when `Remove user` is clicked', () => {
      const clickSpy = stub(siteActions, 'removeUserFromSite').returns(Promise.resolve());
      const rows = wrapper.find('tbody tr');
      const removeUserLink = rows.at(0).find('td').last().find('ButtonLink')
        .shallow();

      expect(removeUserLink.exists()).to.be.true;
      expect(removeUserLink.contains('Remove user')).to.be.true;

      removeUserLink.simulate('click', { preventDefault: () => ({}) });

      expect(clickSpy.called).to.be.true;
    });
  });
});
