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
  user,
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
    const templateListProps = wrapper.find(TemplateSiteList).props();
    const formProps = wrapper.find('ReduxForm').props();

    expect(templateListProps).to.deep.equal({
      handleSubmitTemplate: wrapper.instance().onSubmitTemplate,
      defaultOwner: propsWithoutError.user.data.username,
    });
    expect(formProps.onSubmit).to.equal(wrapper.instance().onAddUserSubmit);
    expect(formProps.showAddNewSiteFields).to.equal(propsWithoutError.showAddNewSiteFields);
    expect(formProps.initialValues).to.deep.equal({ defaultBranch: 'master', engine: 'jekyll' });
  });

  it('delivers onCreateSiteSubmit when showAddNewSiteFields is true', () => {
    const props = Object.assign({}, propsWithoutError);
    props.showAddNewSiteFields = true;

    wrapper = shallow(<Fixture {...props} />);

    const formProps = wrapper.find('ReduxForm').props();
    expect(formProps.onSubmit).to.equal(wrapper.instance().onCreateSiteSubmit);
  });

  it('calls addUserToSite action when add site form is submitted', () => {
    const repoUrl = 'https://github.com/owner/repo';
    wrapper.find('ReduxForm').props().onSubmit({ repoUrl });
    expect(addUserToSite.calledWith({ owner: 'owner', repository: 'repo' })).to.be.true;
  });

  it('calls addSite action when add site form is submitted and showAddNewSiteFields is true', () => {
    const repoUrl = 'https://github.com/boop/beeper-v2';
    const engine = 'vrooooom';
    const defaultBranch = 'tree';

    const props = Object.assign({}, propsWithoutError);
    props.showAddNewSiteFields = true;
    wrapper = shallow(<Fixture {...props} />);

    wrapper.find('ReduxForm').props().onSubmit({ repoUrl, engine, defaultBranch });
    expect(addSite.calledWith({ owner: 'boop', repository: 'beeper-v2', engine, defaultBranch })).to.be.true;
  });

  it('displays an alert banner when add to site action fails', () => {
    const props = Object.assign({}, propsWithoutError, {
      alert: {
        message: 'A site with that name already exists',
      },
    });
    wrapper = shallow(<Fixture {...props} />);

    expect(wrapper.find(AlertBanner)).to.have.length(1);
  });
});
