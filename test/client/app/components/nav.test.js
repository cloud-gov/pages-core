import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import Nav from '../../../../assets/app/components/nav';

describe('<Nav/>', () => {
  let wrapper;

  it('defaults to a logged out state if isLoggedIn is not supplied', () => {
    wrapper = shallow(<Nav/>);

    expect(wrapper.find('a[href="/auth/github"]')).to.have.length(1);
  });

  it('displays a link to log in if isLoggedIn prop is false', () => {
    wrapper = shallow(<Nav isLoggedIn={false}/>);

    expect(wrapper.find('a[href="/auth/github"]')).to.have.length(1);
  });

  it('displays a link to log out if isLoggedIn prop is true', () => {
    wrapper = shallow(<Nav isLoggedIn={true}/>);

    expect(wrapper.find('a[href="/logout"]')).to.have.length(1);
  });
});
