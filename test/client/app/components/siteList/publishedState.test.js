import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import PublishedState from '../../../../../assets/app/components/siteList/publishedState';

const NO_BUILDS_MESSAGE = 'Please wait for build to complete or check logs for error message.';
const PUBLISHED_BASE = 'Please wait for build to complete or check logs for error message.';
const MOST_RECENT_BUILD = 'This site was last published at September 4th 2015, 3:11:23 pm.';
const builds = [
  {
    completedAt: "2015-09-02T21:43:35.000Z"
  },

  {
    completedAt: "2015-09-04T15:11:23.000Z"
  }
];


describe('<PublishedState />', () => {
  let wrapper;

  it('displays a fallback message if the site has no builds', () => {
    wrapper = shallow(<PublishedState />);

    expect(wrapper.find('p').text()).to.equal(NO_BUILDS_MESSAGE);
  });

  it('displays a fallback if build times cant be determined properly', () => {
    wrapper = shallow(<PublishedState builds={[{completedAt: null}]}/>);

    expect(wrapper.find('p').text()).to.equal(PUBLISHED_BASE);
  });

  it('displays the datetime of the most recent build', () => {
    wrapper = shallow(<PublishedState builds={builds} />);

    expect(wrapper.find('p').text()).to.equal(MOST_RECENT_BUILD);
  });
});
