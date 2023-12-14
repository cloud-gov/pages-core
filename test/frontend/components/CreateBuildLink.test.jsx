import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { spy } from 'sinon';
import CreateBuildLink from '../../../frontend/components/CreateBuildLink';

describe('<CreateBuildLink />', () => {
  const props = {
    handlerParams: { dish: 'tacos', cuisine: 'mexican' },
    handleClick: spy(),
    children: 'hey there',
  };

  it('renders its children', () => {
    const wrapper = shallow(<CreateBuildLink {...props} />);
    expect(wrapper.children()).to.have.length(2);
  });

  it('calls the .handleClick function, passing handler params', () => {
    const wrapper = shallow(<CreateBuildLink {...props} />);
    const handler = props.handleClick;
    const params = props.handlerParams;
    const preventDefault = () => ({});

    wrapper.simulate('click', { preventDefault });

    expect(handler.calledOnce).to.be.true;
    expect(handler.calledWith(...Object.keys(params).map(key => params[key]))).to.be.true;
  });
});
