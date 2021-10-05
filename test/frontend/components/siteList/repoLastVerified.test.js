import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import RepoLastVerified from '../../../../frontend/components/siteList/repoLastVerified';

const VERIFIED_BASE = 'Repository not found';
const MOST_RECENT_VERIFIED_TIME = '2015-09-04T15:11:23.000Z';
const FORMATTED_MOST_RECENT_VERIFIED_TIME = 'September 4th 2015, 3:11:23 p.m.';
const MOST_RECENT_VERIFIED = `. Last seen on ${FORMATTED_MOST_RECENT_VERIFIED_TIME}.`;
const userUpdated = new Date(new Date() - (10 * 24 * 60 * 60 * 1000)).toString();

let wrapper;

describe('<RepoLastVerified />', () => {
  it('displays the datetime of the most recent repo verification', () => {
    const site = { repoLastVerified: MOST_RECENT_VERIFIED_TIME };
    wrapper = shallow(<RepoLastVerified site={site} userUpdated={userUpdated} />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE + MOST_RECENT_VERIFIED);
  });

  it('not display most recent repo verification when user just logged in', () => {
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: MOST_RECENT_VERIFIED_TIME }} />);

    expect(wrapper.find('p').length).to.equal(0);
  });

  it('repoLastVerified today - under the threshold', () => {
    const repoLastVerified = new Date(new Date() - (3 * 24 * 60 * 60 * 1000)).toISOString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified }} userUpdated={userUpdated} />);
    expect(wrapper.find('p').length).to.equal(0);
  });

  it('repoLastVerified under passed threshold', () => {
    const repoLastVerified = new Date(new Date() - (3 * 24 * 60 * 60 * 1000)).toISOString();
    const site = { repoLastVerified };
    const user = userUpdated;
    wrapper = shallow(<RepoLastVerified site={site} maxDaysUnverified={2} userUpdated={user} />);
    expect(wrapper.find('p').length).to.equal(1);
  });

  it('repoLastVerified under passed threshold but user just logged in', () => {
    const repoLastVerified = new Date(new Date() - (3 * 24 * 60 * 60 * 1000)).toISOString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified }} maxDaysUnverified={2} />);
    expect(wrapper.find('p').length).to.equal(0);
  });
});
