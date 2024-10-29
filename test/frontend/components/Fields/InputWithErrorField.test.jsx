import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import InputWithErrorField from '../../../../frontend/components/Fields/InputWithErrorField';

describe('<InputWithErrorField />', () => {
  it('renders', () => {
    const props = {
      id: 'anId',
      input: {},
      name: 'aName',
      label: 'the label',
      placeholder: 'placeholder',
      help: <span id="helpspan">help text</span>,
      meta: {
        touched: false,
        error: null,
      },
    };

    const wrapper = shallow(<InputWithErrorField {...props} />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('input[id="anId"][type="url"]')).to.have.length(1);
    expect(wrapper.find('#helpspan')).to.have.length(1);
  });

  it('displays validation errors', () => {
    const props = {
      id: 'anId',
      input: {},
      name: 'aName',
      label: 'the label',
      placeholder: 'put text here',
      meta: {
        touched: false,
        error: null,
      },
    };

    let wrapper = shallow(<InputWithErrorField {...props} />);
    expect(wrapper.find('.usa-input--error')).to.have.length(0);
    expect(wrapper.find('.usa-error-message')).to.have.length(0);

    props.meta.error = 'boop error';
    // touched is still false, so no errors should be shown
    wrapper = shallow(<InputWithErrorField {...props} />);
    expect(wrapper.find('.usa-input--error')).to.have.length(0);
    expect(wrapper.find('.usa-error-message')).to.have.length(0);

    props.meta.touched = true;
    // now that both touched and error have been set,
    // the error should be shown
    wrapper = shallow(<InputWithErrorField {...props} />);
    expect(wrapper.find('.usa-input--error')).to.have.length(1);
    expect(wrapper.find('.usa-error-message')).to.have.length(1);
    expect(wrapper.find('.usa-error-message').text()).to.equal('boop error');
  });
});
