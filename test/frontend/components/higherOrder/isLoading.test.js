import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import isLoading from '../../../../frontend/components/higherOrder/isLoading';

const Component = () => <div></div>;

describe('isLoading()', () => {
  it('renders its component if `loading` is false', () => {
    const props = {
      site: {
        loading: false
      }
    };

    const HoC = isLoading(Component);
    const wrapper = shallow(<HoC {...props} />);

    expect(wrapper.find(Component)).to.have.length(1);
  });

  it('passes props down to its child', () => {
    const props = {
      site: {
        loading: false
      },
      no: 'fun'
    };

    const HoC = isLoading(Component);
    const wrapper = shallow(<HoC {...props} />);

    expect(wrapper.find(Component).props()).to.deep.equal(props);
  });

  describe('renders a fallback', () => {
    const props = {
      site: {
        loading: true
      }
    };
    let wrapper;

    beforeEach(() => {
      const HoC = isLoading(Component);
      wrapper = shallow(<HoC {...props} />);
    });

    it('has prop `loading` set to true', () => {
      expect(wrapper.find('.main-loader')).to.have.length(1);
      expect(wrapper.find(Component)).to.have.length(0);
    });

    it('has no prop `loading` defined', () => {
      expect(wrapper.find('.main-loader')).to.have.length(1);
      expect(wrapper.find(Component)).to.have.length(0);
    })
  });
});
