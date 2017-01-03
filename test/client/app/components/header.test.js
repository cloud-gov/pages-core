import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import Header from '../../../../assets/app/components/header';
import Nav from '../../../../assets/app/components/nav';
import Disclaimer from '../../../../assets/app/components/disclaimer';

describe('<Header/>', () => {
  let wrapper;
  describe('props', () => {
    beforeEach(() => {
      wrapper = shallow(<Header/>);
    });

    it('has props for username', () => {
      expect(wrapper.instance().props.username).to.be.defined;
    });
  });

  it('renders a Nav and a Disclaimer component as children', () => {
    wrapper = shallow(<Header />);
    expect(wrapper.find(Nav)).to.have.length(1);
    expect(wrapper.find(Disclaimer)).to.have.length(1);
  });
});
