import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import ExpandableArea from '../../../frontend/components/ExpandableArea';

describe('<ExpandableArea/>', () => {
  it('renders', () => {
    const wrapper = shallow(
      <ExpandableArea title="Test Title">
        <p>hello</p>
      </ExpandableArea>
    );

    expect(wrapper.exists()).to.be.true;

    const content = wrapper.find('.usa-accordion-content');
    expect(content.exists()).to.be.true;
    expect(content.prop('aria-hidden')).to.equal(true);

    const button = wrapper.find('.usa-accordion-button');
    expect(button.prop('aria-controls')).to.equal(content.prop('id'));
  });
});
