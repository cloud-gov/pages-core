import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import AlertBanner from '../../../frontend/components/alertBanner';

const statusTypes = ['error', 'info'];

describe('<AlertBanner/>', () => {
  it('outputs null when a message isn\'t supplied', () => {
    const component = shallow(<AlertBanner />);
    expect(component.html()).to.equal(null);
  });

  statusTypes.forEach((status) => {
    it(`outputs an ${status} banner when the status is ${status}`, () => {
      const component = shallow(<AlertBanner message="hello" status={status} />);

      expect(component.find(`.usa-alert-${status}`).length).not.to.equal(0);
    });
  });

  it('falls back to an info banner when status is not provided', () => {
    const component = shallow(<AlertBanner message="hello" />);
    expect(component.find('.usa-alert-info').length).not.to.equal(0);
  });

  it('can render a component as a message', () => {
    const componentText = 'Hey there';
    const child = <h1>{componentText}</h1>;
    const wrapper = shallow(<AlertBanner message={child} />);
    const childInstance = wrapper.find('h1');

    expect(childInstance).to.have.length(1);
    expect(childInstance.text()).to.equal(componentText);
  });
});
