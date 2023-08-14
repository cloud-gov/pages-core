import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import SelectSiteEngine from '../../../frontend/components/SelectSiteEngine';

const expectedEngineValues = ['jekyll', 'hugo', 'static', 'node.js'];

describe('<SelectSiteEngine />', () => {
  const props = {
    id: 'hello',
    name: 'hello',
    value: expectedEngineValues[0],
    onChange: spy(),
  };

  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SelectSiteEngine {...props} />);
  });

  it('renders a select element with expect options', () => {
    const select = wrapper.find('select');
    expect(select).to.have.length(1);
    expect(select.props().value).to.equal(props.value);

    expectedEngineValues.forEach((engine) => {
      expect(wrapper.find(`option[value="${engine}"]`)).to.have.length(1);
    });

    const selectSiteEngines = wrapper.getElements()[0].props.children.map(engine => engine.key);
    selectSiteEngines.forEach(engine => expect(expectedEngineValues).to.include(engine));
  });

  it('calls props.onChange when a new option is selected', () => {
    const select = wrapper.find('select');
    expect(props.onChange.notCalled).to.be.true;
    select.simulate('change', { target: { value: expectedEngineValues[2] } });
    expect(props.onChange.calledOnce).to.be.true;
  });
});
