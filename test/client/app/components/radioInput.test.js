import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import RadioInput from '../../../../assets/app/components/radioInput';

const name = 'awesomeRadioButton';
const labelText = `Label for ${name}`;

const props = {
  name,
  labelText,
  checked: false,
  handleChange: spy(),
  value: false
};

describe('<RadioInput/>', () => {
  let wrapper;

  beforeEach(() => wrapper = shallow(<RadioInput {...props}/>));

  describe('render()', () => {
    it('outputs a div wrapper with a radio class', () => {
      expect(wrapper.find('div.radio')).to.have.length(1);
    });

    it('outputs a label with the supplied labelText', () => {
      expect(wrapper.find('label').text()).to.equal(labelText);
    });

    it('outputs an input element of type radio', () => {
      expect(wrapper.find('input[type="radio"]')).to.have.length(1);
    });

    it('outputs an input element with a name attr passed in via props', () => {
      expect(wrapper.find(`input[name="${props.name}"]`)).to.have.length(1);
    });

    it('outputs an input element with checked attr passed in via props', () => {
      const checkedInputProps = Object.assign({}, props, {checked: true});
      const checkedInputWrapper = shallow(<RadioInput {...checkedInputProps}/>);

      expect(/checked/.test(wrapper.find('input'))).to.be.false;
      expect(checkedInputWrapper.find('input[checked=""]')).to.have.length(1);
    });
  });

  describe('Event handling', () => {
    it('calls a handler function when clicked', () => {
      wrapper.simulate('click');
      expect(wrapper.instance().props.handleChange.calledOnce).to.be.true;
    });
  });
});
