import React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';
import lodashClonedeep from 'lodash.clonedeep';

import siteActions from '../../../../frontend/actions/siteActions';
import { mountRouter } from '../../support/_mount';

proxyquire.noCallThru();

const userActions = {
  fetchUserActions: stub(),
};

const { UserActionsTable } = proxyquire('../../../../frontend/components/site/UserActionsTable', {
  '../../actions/userActions': userActions,
});

const { SiteUsers } = proxyquire('../../../../frontend/components/site/SiteUsers', {
  '../icons': { IconGitHub: 'div' },
  './UserActionsTable': UserActionsTable,
});

let state;
const user = {
  isLoading: false,
  data: {
    username: 'not-owner',
    id: 4,
    email: 'not-owner@beep.gov',
  },
};
const defaultState = {
  user,
  sites: {
    isLoading: false,
    data: [
      {
        id: 1,
        owner: 'test-owner',
        repository: 'test-repo',
        users: [
          { id: 1, email: 'not-owner@beep.gov', username: 'not-owner' },
          { id: 2, email: 'owner@beep.gov', username: 'test-owner' },
        ],
      },
    ],
  },
  userActions: {
    data: [],
    isLoading: false,
  },
};

describe('<SiteUsers/>', () => {
  describe('rendered table', () => {
    let wrapper;

    beforeEach(() => {
      state = lodashClonedeep(defaultState);
      wrapper = mountRouter(<SiteUsers />, '/site/:id/users', '/site/1/users', state);
    });

    it('should render', () => {
      expect(wrapper.find('table')).to.have.length(1);
    });

    it('renders rows of users in order of username', () => {
      expect(wrapper.find('table')).to.have.length(1);

      const rows = wrapper.find('tbody tr');
      expect(rows).to.have.length(defaultState.sites.data[0].users.length);

      const expectedOrder = defaultState.sites.data[0].users.map(u => u.username);
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
      const removeUserLink = rows.at(0).find('td').last().find('ButtonLink');

      expect(removeUserLink.exists()).to.be.true;
      expect(removeUserLink.contains('Remove user')).to.be.true;

      removeUserLink.simulate('click', { preventDefault: () => ({}) });

      expect(clickSpy.called).to.be.true;
    });
  });
});
