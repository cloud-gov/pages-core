import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { spy } from 'sinon';

import HttpsUrlInput from '../../../frontend/components/httpsUrlInput';

describe('<HttpsUrlInput/>', () => {
  it('renders', () => {
    const wrapper = shallow(<HttpsUrlInput />);
    const input = wrapper.find('input');
    expect(input.length).to.equal(1);
    expect(input.prop('type')).to.equal('url');
    expect(input.prop('pattern')).to.equal('https://.+\\.\\w{2,}');
    expect(input.prop('placeholder')).to.equal('https://example.gov');
  });

  it('uses props', () => {
    const props = { className: 'boop', placeholder: 'https://boop.gov' };
    const wrapper = shallow(<HttpsUrlInput {...props} />);
    const input = wrapper.find('input');
    expect(input.length).to.equal(1);
    expect(input.prop('className')).to.equal('boop');
    expect(input.prop('placeholder')).to.equal('https://boop.gov');
  });

  it('calls setCustomValidity with correct args', () => {
    const wrapper = shallow(<HttpsUrlInput />);
    const input = wrapper.find('input');

    const onInvalidFunc = input.prop('onInvalid');
    const setCustomValiditySpy = spy();
    onInvalidFunc({ target: { setCustomValidity: setCustomValiditySpy } });
    expect(setCustomValiditySpy.calledWith('Please enter a URL that starts with "https://"')).to.equal(true);

    const onInputFunc = input.prop('onInput');
    onInputFunc({ target: { setCustomValidity: setCustomValiditySpy } });
    expect(setCustomValiditySpy.calledWith('')).to.equal(true);
  });
});
