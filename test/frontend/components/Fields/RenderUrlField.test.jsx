import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import RenderUrlField from '../../../../frontend/components/Fields/RenderUrlField';

describe('<RenderUrlField />', () => {
  it('renders', () => {
    const props = {
      id: 'anId',
      input: {},
      name: 'aName',
      label: 'the label',
      placeholder: 'placeholder',
      help: <span id="helpspan">help text</span>,
      meta: { touched: false, error: null },
    };

    const wrapper = shallow(<RenderUrlField {...props} />);
    expect(wrapper).to.be.defined;
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
      meta: { touched: false, error: null },
    };

    let wrapper = shallow(<RenderUrlField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(0);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(0);

    props.meta.error = 'boop error';
    // touched is still false, so no errors should be shown
    wrapper = shallow(<RenderUrlField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(0);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(0);

    props.meta.touched = true;
    // now that both touched and error have been set,
    // the error should be shown
    wrapper = shallow(<RenderUrlField {...props} />);
    expect(wrapper.find('.usa-input-error')).to.have.length(1);
    expect(wrapper.find('.usa-input-error-message')).to.have.length(1);
    expect(wrapper.find('.usa-input-error-message').text()).to.equal('boop error');
  });
});
