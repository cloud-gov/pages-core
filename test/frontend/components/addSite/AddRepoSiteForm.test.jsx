/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { spy } from 'sinon';

import { AddRepoSiteForm } from '../../../../frontend/components/AddSite/AddRepoSiteForm';

describe('<AddRepoSiteForm />', () => {
  it('renders', () => {
    const props = {
      showAddNewSiteFields: false,
      initialValues: {
        engine: 'jekyll',
      },
      handleSubmit: () => {},
      organizations: {
        data: null,
        isLoading: true,
      },
      pristine: true,
    };

    const wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper).not.to.be.undefined;
    expect(wrapper.find('GitHubRepoUrlField[name="repoUrl"]')).to.have.length(1);
  });

  it('renders additional fields when showAddNewSiteFields is true', () => {
    const props = {
      showAddNewSiteFields: false,
      initialValues: {
        engine: 'jekyll',
      },
      handleSubmit: () => {},
      organizations: {
        data: null,
        isLoading: true,
      },
      pristine: true,
    };

    let wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper.find('Field[name="engine"]')).to.have.length(0);

    props.showAddNewSiteFields = true;
    wrapper = shallow(<AddRepoSiteForm {...props} />);

    const alertBanner = wrapper.find('AlertBanner');

    expect(wrapper.find('Field[name="engine"]')).to.have.length(1);
    expect(alertBanner).to.have.length(1);
    expect(alertBanner.prop('header')).not.to.be.undefined;
    expect(alertBanner.prop('message')).not.to.be.undefined;
  });

  it('makes GitHubRepoUrlField readOnly when showAddNewSiteFields is true', () => {
    const props = {
      showAddNewSiteFields: false,
      initialValues: {
        engine: 'jekyll',
      },
      handleSubmit: () => {},
      organizations: {
        data: null,
        isLoading: true,
      },
      pristine: true,
    };

    let wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper.find('GitHubRepoUrlField[name="repoUrl"]').props().readOnly).to.be
      .false;

    props.showAddNewSiteFields = true;
    wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper.find('GitHubRepoUrlField[name="repoUrl"]').props().readOnly).to.be
      .true;
  });

  it('disables submit when pristine is true', () => {
    const props = {
      showAddNewSiteFields: false,
      initialValues: {
        engine: 'jekyll',
      },
      handleSubmit: () => {},
      organizations: {
        data: null,
        isLoading: true,
      },
      pristine: true,
    };

    let wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper.find('button[type="submit"]').props().disabled).to.be.true;

    props.pristine = false;
    wrapper = shallow(<AddRepoSiteForm {...props} />);
    expect(wrapper.find('button[type="submit"]').props().disabled).to.be.false;
  });

  it('calls handleSubmit when submitted', () => {
    const props = {
      showAddNewSiteFields: false,
      initialValues: {
        engine: 'jekyll',
      },
      handleSubmit: spy(),
      organizations: {
        data: null,
        isLoading: true,
      },
      pristine: false,
    };

    const wrapper = shallow(<AddRepoSiteForm {...props} />);
    wrapper.find('form').simulate('submit');
    expect(props.handleSubmit.calledOnce).to.be.true;
  });
});
