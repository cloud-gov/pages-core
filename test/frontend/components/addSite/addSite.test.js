import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

import templates from '../../../../config/templates';

proxyquire.noCallThru();

const mock = () => () => <div />;

const TemplateSiteList = mock();
const AlertBanner = mock();

const addSite = stub();

const user = {
  isLoading: false,
  data: {
    username: 'jill',
    id: '1',
  },
};

const propsWithoutError = {
  storeState: { user, error: '' },
};

const Fixture = proxyquire('../../../../frontend/components/AddSite', {
  './TemplateSiteList': TemplateSiteList,
  '../alertBanner': AlertBanner,
  '../../actions/siteActions': { addSite },
}).default;

describe('<AddSite/>', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Fixture {...propsWithoutError} />);
  });

  it('has expected default state based on supplied props', () => {
    const actualState = wrapper.state();
    const expectedState = {
      owner: user.data.username,
      engine: 'jekyll',
      defaultBranch: 'master',
      repository: '',
    };

    expect(actualState).to.deep.equal(expectedState);
  });

  it('renders form input elements with the correct initial values', () => {
    const { owner, repository, engine, defaultBranch } = wrapper.state();

    expect(wrapper.find('input[name="owner"]').props().value).to.equal(owner);
    expect(wrapper.find('input[name="repository"]').props().value).to.equal(repository);
    expect(wrapper.find('SelectSiteEngine').props().value).to.equal(engine);
    expect(wrapper.find('input[name="defaultBranch"]').props().value).to.equal(defaultBranch);
  });

  it('renders its children', () => {
    expect(wrapper.find(TemplateSiteList)).to.have.length(1);
    expect(wrapper.find(AlertBanner)).to.have.length(1);
    expect(wrapper.find('Link')).to.have.length(1);
    expect(wrapper.find('form')).to.have.length(1);
  });

  it('calls the add site action when a template is selected', () => {
    const owner = '18F';
    const repository = 'app';
    const template = 'team';

    wrapper.instance().onSubmitTemplate({ owner, repository, template });

    expect(addSite.calledWith({ owner, repository, template })).to.be.true;
  });

  it('delivers the correct props to its children', () => {
    const bannerProps = wrapper.find(AlertBanner).props();
    const templateListProps = wrapper.find(TemplateSiteList).props();
    const formProps = wrapper.find('form').props();

    expect(bannerProps).to.deep.equal({ message: propsWithoutError.storeState.error });
    expect(templateListProps).to.deep.equal({
      templates,
      handleSubmitTemplate: wrapper.instance().onSubmitTemplate,
      defaultOwner: propsWithoutError.storeState.user.data.username,
    });
    expect(formProps.onSubmit).to.equal(wrapper.instance().onSubmit);
  });

  it('calls addSite action when add site form is submitted', () => {
    wrapper.find('form').simulate('submit', { preventDefault: () => {} });
    expect(addSite.called).to.be.true;
  });

  it('updates its state when form fields are changed', () => {
    const repoInput = wrapper.find('input[name="repository"]');
    const newValue = 'ohyeah';

    repoInput.simulate('change', { target: { name: 'repository', value: newValue } });
    expect(wrapper.state().repository).to.equal(newValue);
  });
});
