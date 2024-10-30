import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import { AdvancedSiteSettings } from '../../../../../frontend/components/site/SiteSettings/AdvancedSiteSettings';

describe('<AdvancedSiteSettings/>', () => {
  const makeProps = () => ({
    siteId: 9999,
    initialValues: {
      engine: 'jekyll',
      defaultConfig: 'boop: beep',
    },
    onDelete: spy(),
    onSubmit: spy(),
  });

  it('should render', () => {
    const props = makeProps();
    const wrapper = shallow(<AdvancedSiteSettings {...props} />);
    const form = wrapper.find('ReduxForm');

    expect(wrapper.exists()).to.be.true;
    expect(form).to.have.length(2);
  });

  describe('AdvancedSiteSettingsForm', () => {
    let props;
    let wrapper;
    let form;
    beforeEach(() => {
      props = makeProps();
      wrapper = shallow(<AdvancedSiteSettings {...props} />);
      form = wrapper.find('ReduxForm').at(0); // AdvancedSiteSettingsForm
    });

    it('has props passed down', () => {
      expect(form.prop('initialValues')).to.equal(props.initialValues);
      expect(form.prop('onSubmit')).to.equal(props.onSubmit);
    });
  });

  describe('DeleteSiteForm', () => {
    let props;
    let wrapper;
    let form;
    beforeEach(() => {
      props = makeProps();
      wrapper = shallow(<AdvancedSiteSettings {...props} />);
      form = wrapper.find('ReduxForm').at(1); // DeleteSiteForm
    });

    it('has the onDelete handler as onSubmit', () => {
      expect(form.prop('onSubmit')).to.equal(props.onDelete);
    });
  });
});
