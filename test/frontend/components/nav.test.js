import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Link } from 'react-router';

import Nav from '../../../frontend/components/nav';

const userName = 'el-mapache';
const helpText = 'Documentation';
const contactUsText = 'Contact us';

describe('<Nav/>', () => {
  let wrapper;

  it('has a federalist link as its first element', () => {
    wrapper = shallow(<Nav/>);

    const firstAnchor = wrapper.find('a').first();

    expect(firstAnchor.text()).to.have.equal('Federalist logo');
  });

  it('displays a `contact us` link', () => {
    wrapper = shallow(<Nav/>);

    expect(wrapper.find('a').filter(el => el.text() === contactUsText));
  });

  it('displays a `help` link', () => {
    wrapper = shallow(<Nav/>);

    expect(wrapper.find('a').filter(el => el.text() === helpText));
  });

  it('displays a link to log out', () => {
    wrapper = shallow(<Nav/>);

    expect(wrapper.find('a[href="/logout"]')).to.have.length(1);
  });

  it('displays a link with usersname', () => {
    wrapper = shallow(<Nav username={userName}/>);

    expect(wrapper.find(Link)).to.have.length(1);
    expect(wrapper.find(Link).children().text()).to.equal(userName);
  });
});
