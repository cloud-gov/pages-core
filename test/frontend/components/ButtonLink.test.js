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

  it('should render a button tag', () => {
    expect(wrapper.find('button')).to.have.length(1);
  });

  it('should assign a type of `button` to underlying anchor', () => {
    expect(wrapper.find('button').prop('type')).to.equal('button');
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
    wrapper.find('button').simulate('click');

    expect(props.clickHandler.calledOnce).to.be.true;
  });
});
