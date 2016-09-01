import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import AlertBanner from '../../../../assets/app/components/alertBanner';

const statusTypes = ['error', 'info'];

describe('<AlertBanner/>', () => {
  it('outputs null when a message isn\'t supplied', () => {
    const component = shallow(<AlertBanner />);
    expect(component.html()).to.equal(null);
  });

  statusTypes.forEach(status => {
    it(`outputs an ${status} banner when the status is ${status}`, () => {
      const component = shallow(<AlertBanner message='hello' status={status}/>);

      expect(component.find(`.usa-alert-${status}`).length).not.to.equal(0);
    });
  });

  it('falls back to an info banner when status is not provided', () => {
    const component = shallow(<AlertBanner message='hello'/>);
    expect(component.find(`.usa-alert-info`).length).not.to.equal(0);
  });
});
