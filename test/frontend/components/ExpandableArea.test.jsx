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
    expect(content.find('p').exists()).to.be.false;

    const button = wrapper.find('.usa-accordion-button');
    expect(button.prop('aria-controls')).to.equal(content.prop('id'));
  });

  it('toggles from collapsed to expanded', () => {
    const wrapper = shallow(
      <ExpandableArea title="Test Title">
        <p>hello</p>
      </ExpandableArea>
    );
    expect(wrapper.exists()).to.be.true;

    let button = wrapper.find('.usa-accordion-button');
    let content = wrapper.find('.usa-accordion-content');

    // start collapsed
    expect(button.prop('aria-expanded')).to.equal(false);
    expect(content.prop('aria-hidden')).to.equal(true);

    // click to toggle to expanded
    button.simulate('click');
    button = wrapper.find('.usa-accordion-button');
    content = wrapper.find('.usa-accordion-content');
    expect(button.prop('aria-expanded')).to.equal(true);
    expect(content.prop('aria-hidden')).to.equal(false);

    // click to toggle back to collapsed
    button.simulate('click');
    button = wrapper.find('.usa-accordion-button');
    content = wrapper.find('.usa-accordion-content');
    expect(button.prop('aria-expanded')).to.equal(false);
    expect(content.prop('aria-hidden')).to.equal(true);
  });
});
