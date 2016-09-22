import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Link } from 'react-router';

import Nav from '../../../../assets/app/components/nav';

const userName = 'el-mapache';
const helpText = 'Help';
const contactUsText = 'Contact us';

describe('<Nav/>', () => {
  let wrapper;

  it('has a federalist link as its first element', () => {
    wrapper = shallow(<Nav/>);

    const firstAnchor = wrapper.find('a').first();

    expect(firstAnchor.text()).to.have.equal('Federalist logo');
  });

  it('defaults to a logged out state if isLoggedIn is not supplied', () => {
    wrapper = shallow(<Nav/>);

    expect(wrapper.find('a[href="/auth/github"]')).to.have.length(1);
  });

  describe('when prop isLoggedIn is false', () => {
    beforeEach(() => {
      wrapper = shallow(<Nav isLoggedIn={false}/>);
    });

    it('displays a `contact us` link', () => {
      expect(wrapper.find('a').filter(el => el.text() === contactUsText));
    });

    it('displays a `help` link', () => {
      expect(wrapper.find('a').filter(el => el.text() === helpText));
    });

    it('displays a `log in` link', () => {
      expect(wrapper.find('a[href="/auth/github"]')).to.have.length(1);
    });
  });

  describe('when prop isLoggedIn is true', () => {
    it('displays a link to log out if isLoggedIn prop is true', () => {
      wrapper = shallow(<Nav isLoggedIn={true}/>);

      expect(wrapper.find('a[href="/logout"]')).to.have.length(1);
    });

    it('displays link with usersname when logged in', () => {
      wrapper = shallow(<Nav isLoggedIn={true} username={userName}/>);

      expect(wrapper.find(Link)).to.have.length(1);
      expect(wrapper.find(Link).children().text()).to.equal(userName);
    });
  });
});
