import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { spy } from 'sinon';

import ReduxFormBasicSiteSettings, { BasicSiteSettings } from '../../../../../frontend/components/site/SiteSettings/BasicSiteSettings';

describe('<BasicSiteSettings/>', () => {
  const makeProps = () => (
    {
      initialValues: {
        defaultBranch: 'main',
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
    const branchFields = wrapper.find('BranchField');

    expect(wrapper.exists()).to.be.true;
    expect(branchFields).to.have.length(2);
    expect(branchFields.at(0).prop('name')).to.equal('defaultBranch');
    expect(branchFields.at(1).prop('name')).to.equal('demoBranch');
    expect(wrapper.find('HttpsUrlField')).to.have.length(2);

    const domainField = wrapper.find('HttpsUrlField[name="domain"]');
    expect(domainField.exists()).to.be.true;
    expect(domainField.props()).to.deep.equal({
      label: 'Live URL:',
      name: 'domain',
      id: 'domainInput',
      placeholder: 'https://example.gov',
      className: 'form-control',
    });

    const demoDomainField = wrapper.find('HttpsUrlField[name="demoDomain"]');
    expect(demoDomainField.exists()).to.be.true;
    expect(demoDomainField.props()).to.deep.equal({
      label: 'Demo URL:',
      name: 'demoDomain',
      id: 'demoDomainInput',
      placeholder: 'https://demo.example.gov',
      className: 'form-control',
    });
  });

  it('should have its buttons disabled when pristine', () => {
    const props = makeProps();
    let wrapper = shallow(<BasicSiteSettings {...props} />);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('button.usa-button-secondary').prop('disabled')).to.be.true;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.true;

    props.pristine = false;
    wrapper = shallow(<BasicSiteSettings {...props} />);
    expect(wrapper.find('button.usa-button-secondary').prop('disabled')).to.be.false;
    expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.false;
  });

  it('should call reset when Reset button is clicked', () => {
    const props = makeProps();
    props.pristine = false;
    const wrapper = shallow(<BasicSiteSettings {...props} />);
    const resetButton = wrapper.find('button.usa-button-secondary');

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
