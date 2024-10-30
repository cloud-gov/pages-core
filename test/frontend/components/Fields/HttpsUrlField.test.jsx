import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import HttpsUrlField, {
  isHttpsUrlWithoutPath,
} from '../../../../frontend/components/Fields/HttpsUrlField';

describe('<HttpsUrlField />', () => {
  it('renders', () => {
    const props = {
      id: 'boopId',
      name: 'boopName',
    };

    const wrapper = shallow(<HttpsUrlField {...props} />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('Field[id="boopId"]')).to.have.length(1);
  });

  it('has validators specified', () => {
    const props = {
      id: 'boopId',
      name: 'boopName',
    };

    const wrapper = shallow(<HttpsUrlField {...props} />);
    const validateProp = wrapper.props().validate;
    expect(validateProp.length).to.equal(1);
    expect(validateProp.indexOf(isHttpsUrlWithoutPath)).to.be.above(-1);
  });

  describe('isHttpsUrlWithoutPath validator', () => {
    it('validates', () => {
      const msg =
        'Please enter a URL that starts with "https://" and has no trailing path';
      expect(isHttpsUrlWithoutPath()).to.be.undefined;
      expect(isHttpsUrlWithoutPath('')).to.be.undefined;

      expect(isHttpsUrlWithoutPath('anything')).to.equal(msg);
      expect(isHttpsUrlWithoutPath('boop.com')).to.equal(msg);
      expect(isHttpsUrlWithoutPath('https:boop.com')).to.equal(msg);
      expect(isHttpsUrlWithoutPath('http://boop.com')).to.equal(msg);
      expect(isHttpsUrlWithoutPath('https://boop.com/')).to.equal(msg);
      expect(isHttpsUrlWithoutPath('https://boop.com/subdir')).to.equal(msg);

      expect(isHttpsUrlWithoutPath('https://example.com')).to.be.undefined;
      expect(isHttpsUrlWithoutPath('https://subdomain.example.com')).to.be.undefined;
      expect(isHttpsUrlWithoutPath('https://has-hyphens-and-123.example.com')).to.be
        .undefined;
      expect(isHttpsUrlWithoutPath('https://a.b.example.com')).to.be.undefined;
    });
  });
});
