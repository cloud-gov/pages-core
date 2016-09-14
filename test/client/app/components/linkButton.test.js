import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import { Link } from 'react-router';
import LinkButton from '../../../../assets/app/components/linkButton';

const linkButton =
  <LinkButton
    href="https://site.org"
    text="click here"
    className="another-class"
    alt="alt text"
  />;

class ButtonChild extends React.Component {
  render() {
    return 'I am a child';
  }
};

describe('<LinkButton/>', () => {
  let wrapper;

  describe('props', () => {
    const props = ['alt', 'className', 'text', 'href'];

    wrapper = shallow(linkButton);

    let propKeys = Object.keys(wrapper.instance().props);

    props.forEach(prop => {
      it(`has prop ${prop}`, () => {
        expect(propKeys.indexOf(prop)).not.to.equal(-1);
      });
    });
  });

  beforeEach(() => wrapper = shallow(linkButton));

  it('renders a <Link/> tag', () => {
    expect(wrapper.find(Link)).to.have.length(1);
  });

  it('adds supplied classnames to the default classes', () => {
    expect(wrapper.hasClass('usa-button')).to.be.true;
    expect(wrapper.hasClass('another-class')).to.be.true;
  });

  it('accepts a text property as a child', () => {
    expect(wrapper.children().text()).to.equal('click here');
  });

  it('accepts arbitrary react components as children', () => {
    const wrapperWithKids =
      shallow(<LinkButton href="https://google.com"><ButtonChild/></LinkButton>);

    expect(wrapperWithKids.contains(<ButtonChild/>)).to.be.true;
  });
});
