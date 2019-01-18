import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import RepoLastVerified from '../../../../frontend/components/siteList/repoLastVerified';

const VERIFIED_BASE = 'Repository not found';
const MOST_RECENT_VERIFIED_TIME = '2015-09-04T15:11:23.000Z';
const FORMATTED_MOST_RECENT_VERIFIED_TIME = 'September 4th 2015, 3:11:23 pm';
const MOST_RECENT_VERIFIED = `. Last seen on ${FORMATTED_MOST_RECENT_VERIFIED_TIME}.`;

let wrapper;

describe('<RepoLastVerified />', () => {
  it('displays warning if not found and site older than threshold', () => {
    const daysNotFound = 6; // greater than default threshold 5
    const createdAt = new Date(new Date() - (daysNotFound * 24 * 60 * 60 * 1000)).toString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: undefined, createdAt }} />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE);
  });

  it('does not display warning if not found and site created less than threshold', () => {
    const daysNotFound = 3; // greater than default threshold 5
    const createdAt = new Date(new Date() - (daysNotFound * 24 * 60 * 60 * 1000)).toString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: undefined, createdAt }} />);

    expect(wrapper.find('p').length).to.equal(0);
  });

  it('displays the datetime of the most recent repo verification', () => {
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: MOST_RECENT_VERIFIED_TIME }} />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE + MOST_RECENT_VERIFIED);
  });

  it('repoLastVerified today - under the threshold', () => {
    const repoLastVerified = new Date(new Date() - (3 * 24 * 60 * 60 * 1000)).toString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified }} />);
    expect(wrapper.find('p').length).to.equal(0);
  });

  it('repoLastVerified under passed threshold', () => {
    const repoLastVerified = new Date(new Date() - (3 * 24 * 60 * 60 * 1000)).toString();
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified }} daysNotFound={2} />);
    expect(wrapper.find('p').length).to.equal(1);
  });
});
