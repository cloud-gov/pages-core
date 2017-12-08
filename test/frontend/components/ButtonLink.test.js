import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';
import ButtonLink from '../../../frontend/components/ButtonLink';

describe('<ButtonLink />', () => {
  const props = {
    clickHandler: spy(),
    children: 'a child',
  };
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ButtonLink {...props} />);
  });

  it('should render an anchor tag', () => {
    expect(wrapper.find('a')).to.have.length(1);
  });

  it('should assign a role of `button` to underlying anchor', () => {
    expect(wrapper.find('a').prop('role')).to.equal('button');
  });

  it('should render its children', () => {
    expect(wrapper.children()).to.have.length(1);

    const otherProps = {
      ...props,
      children: ['test', 'test2'],
    };
    const anotherWrapper = shallow(<ButtonLink {...otherProps} />);

    expect(anotherWrapper.children()).to.have.length(2);
  });

  it('should call the clickHandler', () => {
    wrapper.find('a').simulate('click');

    expect(props.clickHandler.calledOnce).to.be.true;
  });
});
