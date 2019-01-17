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
  it('displays a fallback message if the site is not verified', () => {
    wrapper = shallow(<RepoLastVerified />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE);
  });

  it('displays a fallback if verified times cant be determined properly', () => {
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: undefined }} />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE);
  });

  it('displays the datetime of the most recent repo verification', () => {
    wrapper = shallow(<RepoLastVerified site={{ repoLastVerified: MOST_RECENT_VERIFIED_TIME }} />);

    expect(wrapper.find('p').text()).to.equal(VERIFIED_BASE + MOST_RECENT_VERIFIED);
  });
});
