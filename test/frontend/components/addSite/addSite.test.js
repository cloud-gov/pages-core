import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const mock = () => () => <div />;

const TemplateSiteList = mock();
const AlertBanner = mock();

const addSite = stub();
const hideAddNewSiteFields = stub();
const addUserToSite = stub();

const user = {
  isLoading: false,
  data: {
    username: 'jill',
    id: '1',
  },
};

const propsWithoutError = {
  storeState: { user, error: '' },
  showAddNewSiteFields: false,
};

const Fixture = proxyquire('../../../../frontend/components/AddSite', {
  './TemplateSiteList': TemplateSiteList,
  '../alertBanner': AlertBanner,
  '../../actions/siteActions': { addSite, addUserToSite },
  '../../actions/addNewSiteFieldsActions': { hideAddNewSiteFields },
}).AddSite;

describe('<AddSite/>', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Fixture {...propsWithoutError} />);
  });

  it('calls addNewSiteFieldsActions.hideAddNewSiteFields on unmount', () => {
    expect(hideAddNewSiteFields.calledOnce).to.be.false;
    wrapper.unmount();
    expect(hideAddNewSiteFields.calledOnce).to.be.true;
  });

  it('renders its children', () => {
    expect(wrapper.find(TemplateSiteList)).to.have.length(1);
    expect(wrapper.find(AlertBanner)).to.have.length(1);
    expect(wrapper.find('ReduxForm')).to.have.length(1);
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
    const formProps = wrapper.find('ReduxForm').props();

    expect(bannerProps).to.deep.equal({ message: propsWithoutError.storeState.error });
    expect(templateListProps).to.deep.equal({
      handleSubmitTemplate: wrapper.instance().onSubmitTemplate,
      defaultOwner: propsWithoutError.storeState.user.data.username,
    });
    expect(formProps.onSubmit).to.equal(wrapper.instance().onAddRepoSiteSubmit);
    expect(formProps.showAddNewSiteFields).to.equal(propsWithoutError.showAddNewSiteFields);
  });

  it('calls addUserToSite action when add site form is submitted without engine and defaultBranch', () => {
    const owner = 'boop';
    const repository = 'beeper-beta-v2';
    wrapper.find('ReduxForm').props().onSubmit({ owner, repository });
    expect(addUserToSite.calledWith({ owner, repository })).to.be.true;
  });

  it('calls addSite action when add site form is submitted with all fields', () => {
    const owner = 'boop';
    const repository = 'beeper-beta-v2';
    const engine = 'vrooooom';
    const defaultBranch = 'tree';
    wrapper.find('ReduxForm').props().onSubmit({ owner, repository, engine, defaultBranch });
    expect(addSite.calledWith({ owner, repository, engine, defaultBranch })).to.be.true;
  });
});
