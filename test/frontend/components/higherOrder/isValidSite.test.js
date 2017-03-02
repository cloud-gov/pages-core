import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import isValidSite from '../../../../frontend/components/higherOrder/isValidSite';

const mock = () => {
  return function() {
    return <div></div>;
  };
};

const Component = mock();

describe('hasConfig()', () => {
  describe('returns a fallback', () => {
    const site = {
      invalid: true,
      files: [{}]
    };

    let wrapper;

    beforeEach(() => {
      const HoC = isValidSite(Component);
      wrapper = shallow(<HoC site={site} />);
    });

    it('has an `invalid` prop', () => {
      expect(wrapper.find('h4')).to.have.length(1);
      expect(wrapper.find(Component)).to.have.length(0);
    });

    it('has an empty `files` prop', () => {
      expect(wrapper.find('h4')).to.have.length(1);
      expect(wrapper.find(Component)).to.have.length(0);
    });
  });

  describe('returns the supplied component', () => {
    it('has file and the site is not invalid', () => {
      const site = {
        invalid: false,
        files: [{}]
      };

      const HoC = isValidSite(Component);
      const wrapper = shallow(<HoC site={site} />);

      expect(wrapper.find(Component)).to.have.length(1);
    });
  });
});
