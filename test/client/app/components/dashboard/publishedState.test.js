import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import PublishedState from '../../../../../assets/app/components/Dashboard/publishedState';

const NO_BUILDS_MESSAGE = 'This site has not been published yet. Please wait while the site is built.';
const PUBLISHED_BASE = 'This site was last published at';
const FOREVER = 'forever ago';
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

    expect(wrapper.find('p').text()).to.equal(`${PUBLISHED_BASE} ${FOREVER}`);
  });

  it('displays the datetime of the most recent build', () => {
    wrapper = shallow(<PublishedState builds={builds} />);

    expect(wrapper.find('p').text()).to.match(/\b2015-09-04T15:11:23\.000Z\b/);
  });
});
