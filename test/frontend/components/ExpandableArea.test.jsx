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

    const content = wrapper.find('.expandable-area-content');
    expect(content.exists()).to.be.true;
    expect(content.find('p').exists()).to.be.true;
    expect(content.find('p').text()).to.equal('hello');

    const button = wrapper.find('.expandable-area-button');
    expect(button.prop('aria-controls')).to.equal(content.prop('id'));
  });

  it('toggles from collapsed to expanded', () => {
    const wrapper = shallow(
      <ExpandableArea title="Test Title">
        <p>hello</p>
      </ExpandableArea>
    );
    expect(wrapper.exists()).to.be.true;

    let button = wrapper.find('.expandable-area-button');
    let content = wrapper.find('.expandable-area-content');

    // start collapsed
    expect(button.prop('aria-expanded')).to.equal(false);
    expect(content.prop('aria-hidden')).to.equal(true);

    // click to toggle to expanded
    button.simulate('click');
    button = wrapper.find('.expandable-area-button');
    content = wrapper.find('.expandable-area-content');
    expect(button.prop('aria-expanded')).to.equal(true);
    expect(content.prop('aria-hidden')).to.equal(false);

    // click to toggle back to collapsed
    button.simulate('click');
    button = wrapper.find('.expandable-area-button');
    content = wrapper.find('.expandable-area-content');
    expect(button.prop('aria-expanded')).to.equal(false);
    expect(content.prop('aria-hidden')).to.equal(true);
  });
});
