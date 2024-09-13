import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import ReduxFormAdvancedSiteSettings, { AdvancedSiteSettingsForm } from '../../../../../frontend/components/site/SiteSettings/AdvancedSiteSettingsForm';

describe('<AdvancedSiteSettingsForm/>', () => {
  const makeProps = () => (
    {
      initialValues: {
        engine: 'jekyll',
        defaultConfig: 'boop: beep',
      },
      handleSubmit: spy(),
      reset: spy(),
      pristine: true,
    }
  );

  it('should export a ReduxForm-connected component', () => {
    expect(ReduxFormAdvancedSiteSettings).to.not.be.null;
  });

  it('should render', () => {
    const props = makeProps();
    const wrapper = shallow(<AdvancedSiteSettingsForm {...props} />);

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('Field')).to.have.length(1);
    expect(wrapper.find('Field[name="engine"]').exists()).to.be.true;
  });

  it('should have its buttons disabled when pristine', () => {
    const props = makeProps();
    let wrapper = shallow(<AdvancedSiteSettingsForm {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('button.usa-button.usa-button--outline').prop('disabled')).to.be.true;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.true;

    props.pristine = false;
    wrapper = shallow(<AdvancedSiteSettingsForm {...props} />);
    expect(wrapper.find('button.usa-button.usa-button--outline').prop('disabled')).to.be.false;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.false;
  });

  it('should call reset when Reset button is clicked', () => {
    const props = makeProps();
    props.pristine = false;
    const wrapper = shallow(<AdvancedSiteSettingsForm {...props} />);
    const resetButton = wrapper.find('button.usa-button.usa-button--outline');

    expect(props.reset.called).to.be.false;
    resetButton.simulate('click');
    expect(props.reset.calledOnce).to.be.true;
  });

  it('should call handleSubmit when form is submitted', () => {
    const props = makeProps();
    props.pristine = false;
    const wrapper = shallow(<AdvancedSiteSettingsForm {...props} />);
    const form = wrapper.find('form');

    expect(props.handleSubmit.called).to.be.false;
    form.simulate('submit');
    expect(props.handleSubmit.calledOnce).to.be.true;
  });
});
