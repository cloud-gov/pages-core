import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import { AdvancedSiteSettings } from '../../../../../frontend/components/site/SiteSettings/AdvancedSiteSettings';

describe('<AdvancedSiteSettings/>', () => {
  const makeProps = () => (
    {
      siteId: 9999,
      initialValues: {
        engine: 'jekyll',
        config: 'boop: beep',
      },
      onDelete: spy(),
      onSubmit: spy(),
    }
  );

  it('should render', () => {
    const props = makeProps();
    const wrapper = shallow(<AdvancedSiteSettings {...props} />);
    const form = wrapper.find('ReduxForm'); // AdvancedSiteSettingsForm

    expect(wrapper.exists()).to.be.true;
    expect(form).to.have.length(1);
  });

  describe('AdvancedSiteSettingsForm', () => {
    let props;
    let wrapper;
    let form;
    beforeEach(() => {
      props = makeProps();
      wrapper = shallow(<AdvancedSiteSettings {...props} />);
      form = wrapper.find('ReduxForm'); // AdvancedSiteSettingsForm
    });

    it('has props passed down', () => {
      expect(form.prop('initialValues')).to.deep.equal(props.initialValues);
      expect(form.prop('siteId')).to.deep.equal(props.siteId);
      expect(form.prop('onDelete')).to.deep.equal(props.onDelete);
      expect(form.prop('onSubmit')).to.deep.equal(props.onSubmit);
    });
  });
});
