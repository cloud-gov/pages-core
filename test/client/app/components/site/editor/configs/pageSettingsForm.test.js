import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import PageSettingsForm from '../../../../../../../assets/app/components/site/editor/configs/pageSettingsForm';

const FIELD_PROPS = {
  name: 'title',
  value: 'my great page',
  onChange: () => {}
};

const props = {
  fields: [
    {
      field: 'input',
      props: FIELD_PROPS
    }
  ]
};

describe('<PageSettingsForm />', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<PageSettingsForm {...props} />);
  });

  it('outputs a label with the name of the field as the text', () => {
    expect(wrapper.find('label').text()).to.equal(FIELD_PROPS.name);
  });

  it('outputs the correct form field given props', () => {
    expect(wrapper.find('input')).to.have.length(1);
  });

  it('provides the correct props to the rendered form field', () => {
    expect(wrapper.find('input').props()).to.deep.equals(FIELD_PROPS)
  });

  it('outputs an empty div when no form field configs are supplied', () => {
    expect(shallow(<PageSettingsForm/>).children()).to.have.length(0);
  });
});
