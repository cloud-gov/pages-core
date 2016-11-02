import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import hasConfig from '../../../../../assets/app/components/higherOrder/hasConfig';

const mock = React.createClass({
  render() {
    return <div></div>;
  }
});

describe('hasConfig()', () => {
  it('returns the supplied component when the config property is exactly not null', () => {
    const site = {
      config: ''
    };

    const HigherOrderComponent = hasConfig(mock);
    const wrapper = shallow(<HigherOrderComponent site={site} />);

    expect(/div/.test(wrapper.html())).to.be.true;
  });

  it('renders a fallback when config is null', () => {
    const site = {
      config: null
    };
    const HigherOrderComponent = hasConfig(mock);
    const wrapper = shallow(<HigherOrderComponent site={site} />);

    expect(wrapper.find('h4')).to.have.length(1);
    expect(/div/.test(wrapper.html())).to.be.false;
  })
});
