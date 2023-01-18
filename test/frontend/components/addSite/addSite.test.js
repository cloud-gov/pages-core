/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { expect } from 'chai';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';
import lodashClonedeep from 'lodash.clonedeep';

import { mountRouter } from '../../support/_mount';

proxyquire.noCallThru();

const mock = () => () => <div />;

const TemplateSiteList = mock();
const AlertBanner = mock();

const addSite = stub();
const hideAddNewSiteFields = stub();
const addUserToSite = stub();
addUserToSite.resolves(true);

const user = {
  isLoading: false,
  data: {
    username: 'jill',
    id: '1',
  },
};

const organizations = {
  data: [{
    id: 1,
    name: 'org-1',
  }],
  isLoading: false,
};

const sites = {
  data: [],
  isLoading: false,
};

const defaultState = {
  organizations,
  sites,
  user,
  showAddNewSiteFields: false,
};

const { AddSite } = proxyquire('../../../../frontend/components/AddSite', {
  './TemplateSiteList': TemplateSiteList,
  '../alertBanner': AlertBanner,
  '../../actions/siteActions': { addSite, addUserToSite },
  '../../actions/addNewSiteFieldsActions': { hideAddNewSiteFields },
});

describe('<AddSite/>', () => {
  let wrapper;
  let state;

  beforeEach(() => {
    state = lodashClonedeep(defaultState);
    wrapper = mountRouter(<AddSite />, '/sites/new', '/sites/new', state);
    addSite.resetHistory();
  });

  it('calls addNewSiteFieldsActions.hideAddNewSiteFields on unmount', () => {
    expect(hideAddNewSiteFields.calledOnce).to.be.false;
    wrapper.unmount();
    expect(hideAddNewSiteFields.calledOnce).to.be.true;
  });

  it('renders its children', () => {
    expect(wrapper.find(TemplateSiteList)).to.have.length(1);
    // for unclear reasons, mounted ReduxForm renders with an extra form nested in the initial form
    expect(wrapper.find('ReduxForm')).to.have.length(2);
  });

  it('delivers the correct props to its children', () => {
    const templateListProps = wrapper.find(TemplateSiteList).props();
    const formProps = wrapper.find('ReduxForm').at(0).props();

    expect(templateListProps).to.deep.equal({
      defaultOwner: state.user.data.username,
      organizations: state.organizations,
    });
    // expect(formProps.onSubmit).to.equal(onAddUserSubmit);
    expect(formProps.showAddNewSiteFields).to.equal(state.showAddNewSiteFields);
    expect(formProps.initialValues).to.deep.equal({
      engine: 'jekyll',
    });
  });

  it('delivers onCreateSiteSubmit when showAddNewSiteFields is true', () => {
    state.showAddNewSiteFields = true;

    wrapper = mountRouter(<AddSite />, '/sites/new', '/sites/new', state);

    const formProps = wrapper.find('ReduxForm').at(0).props();
    // expect(formProps.onSubmit).to.equal(onCreateSiteSubmit);
  });

  it('calls addUserToSite action when add site form is submitted', () => {
    const repoUrl = 'https://github.com/owner/repo';
    wrapper.find('ReduxForm').at(0).props().onSubmit({ repoUrl });
    expect(addUserToSite.calledWith({ owner: 'owner', repository: 'repo' })).to.be.true;
  });

  it('calls addSite action when add site form is submitted and showAddNewSiteFields is true', () => {
    const repoUrl = 'https://github.com/boop/beeper-v2';
    const engine = 'vrooooom';
    const repoOrganizationId = organizations.data[0].id;

    state.showAddNewSiteFields = true;
    wrapper = mountRouter(<AddSite />, '/sites/new', '/sites/new', state);

    wrapper.find('ReduxForm').at(0).props().onSubmit({ repoUrl, engine, repoOrganizationId });

    expect(addSite.calledWith({
      owner: 'boop',
      repository: 'beeper-v2',
      engine,
      organizationId: repoOrganizationId,
    })).to.be.true;
  });

  it('user with no orgs cannot use this page', () => {
    state.showAddNewSiteFields = true;
    state.organizations.data = [];

    wrapper = mountRouter(<AddSite />, '/sites/new', '/sites/new', state);
    expect(wrapper.find(AlertBanner)).to.have.length(2);
  });

  it('displays an alert banner when add to site action fails', () => {
    state.alert = {
      message: 'A site with that name already exists',
    };
    wrapper = mountRouter(<AddSite />, '/sites/new', '/sites/new', state);

    expect(wrapper.find(AlertBanner)).to.have.length(1);
  });
});
