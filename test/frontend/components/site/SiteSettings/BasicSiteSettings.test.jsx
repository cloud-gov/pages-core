import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import ReduxFormBasicSiteSettings, { BasicSiteSettings } from '../../../../../frontend/components/site/SiteSettings/BasicSiteSettings';

describe('<BasicSiteSettings/>', () => {
  const makeProps = () => (
    {
      initialValues: {
        defaultBranch: 'master',
        domain: 'https://example.gov',
      },
      handleSubmit: spy(),
      reset: spy(),
      pristine: true,
    }
  );

  it('should export a ReduxForm-connected component', () => {
    expect(ReduxFormBasicSiteSettings).to.not.be.null;
  });

  it('should render', () => {
    const props = makeProps();
    const wrapper = shallow(<BasicSiteSettings {...props} />);
    expect(wrapper.exists()).to.be.true;

    expect(wrapper.find('Field')).to.have.length(4);
    expect(wrapper.find('Field[name="defaultBranch"]').exists()).to.be.true;
    expect(wrapper.find('Field[name="domain"]').exists()).to.be.true;
    expect(wrapper.find('Field[name="demoBranch"]').exists()).to.be.true;
    expect(wrapper.find('Field[name="demoDomain"]').exists()).to.be.true;
  });

  it('should have its buttons disabled when pristine', () => {
    const props = makeProps();
    let wrapper = shallow(<BasicSiteSettings {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('button.button-reset').prop('disabled')).to.be.true;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.true;

    props.pristine = false;
    wrapper = shallow(<BasicSiteSettings {...props} />);
    expect(wrapper.find('button.button-reset').prop('disabled')).to.be.false;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.false;
  });

  it('should call reset when Reset button is clicked', () => {
    const props = makeProps();
    props.pristine = false;
    const wrapper = shallow(<BasicSiteSettings {...props} />);
    const resetButton = wrapper.find('button.button-reset');

    expect(props.reset.called).to.be.false;
    resetButton.simulate('click');
    expect(props.reset.calledOnce).to.be.true;
  });

  it('should call handleSubmit when form is submitted', () => {
    const props = makeProps();
    props.pristine = false;
    const wrapper = shallow(<BasicSiteSettings {...props} />);
    const form = wrapper.find('form');

    expect(props.handleSubmit.called).to.be.false;
    form.simulate('submit');
    expect(props.handleSubmit.calledOnce).to.be.true;
  });
});
