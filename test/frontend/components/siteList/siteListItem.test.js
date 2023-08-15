import React from 'react';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { Link } from 'react-router-dom';

import siteActions from '../../../../frontend/actions/siteActions';
import { mountRouter } from '../../support/_mount';

proxyquire.noCallThru();

const PublishedState = () => <div />;
const RepoLastVerified = () => <div />;
const GitHubLink = () => <div />;

const SiteListItem = proxyquire('../../../../frontend/components/siteList/siteListItem', {
  './publishedState': PublishedState,
  './repoLastVerified': RepoLastVerified,
  '../GitHubLink': GitHubLink,
  '../icons': { IconView: 'div' },
}).default;

const testSite = {
  repository: 'something',
  owner: 'someone',
  id: 1,
  viewLink: 'https://mysiteishere.biz',
  isActive: true,
};

const testUser = {
  username: 'not-owner',
  id: 4,
  email: 'not-owner@beep.gov',
  updatedAt: new Date(new Date() - (10 * 24 * 60 * 60 * 1000)).toString(),
};

const testOrganization = {
  id: 1,
  name: 'org-1',
  isSandbox: false,
  isActive: true,
};

describe('<SiteListItem />', () => {
  let wrapper;

  beforeEach(() => {

  });

  afterEach(sinon.restore);

  it('outputs a published state component', () => {
    wrapper = mountRouter(<SiteListItem site={testSite} user={testUser} />);
    expect(wrapper.find(PublishedState).props()).to.deep.equals({ site: testSite });
    expect(wrapper.find(PublishedState)).to.have.length(1);
  });

  it('outputs a repo last verified component', () => {
    wrapper = mountRouter(<SiteListItem site={testSite} user={testUser} />);
    expect(wrapper.find(RepoLastVerified).props()).to.deep.equals({
      site: testSite,
      userUpdated: testUser.updatedAt,
    });
    expect(wrapper.find(RepoLastVerified)).to.have.length(1);
  });

  it('outputs a link component to direct user to the site page w/o org prop', () => {
    wrapper = mountRouter(<SiteListItem site={testSite} user={testUser} />);
    expect(wrapper.find(Link).props()).to.deep.equals({
      to: `/sites/${testSite.id}`,
      children: `${testSite.owner}/${testSite.repository}`,
      title: 'View site settings',
    });
    expect(wrapper.find(Link)).to.have.length(1);
  });

  it('outputs a link component to direct user to the site page w/ org prop', () => {
    wrapper = mountRouter(
      <SiteListItem
        site={testSite}
        user={testUser}
        organization={testOrganization}
      />
    );
    expect(wrapper.find(Link).props()).to.deep.equals({
      to: `/sites/${testSite.id}`,
      children: `${testSite.owner}/${testSite.repository}`,
      title: 'View site settings',
    });
    expect(wrapper.find(Link)).to.have.length(1);
  });

  it('no Link if org is inactive', () => {
    const org = { ...testOrganization, isActive: false };
    wrapper = mountRouter(<SiteListItem site={testSite} user={testUser} organization={org} />);
    expect(wrapper.find(Link)).to.have.length(0);
    expect(wrapper.find('h4')).to.have.length(1);
  });

  it('no Link if org site is inactive', () => {
    const site = { ...testSite, isActive: false };
    wrapper = mountRouter(
      <SiteListItem
        site={site}
        user={testUser}
        organization={testOrganization}
      />
    );
    expect(wrapper.find(Link)).to.have.length(0);
    expect(wrapper.find('h4')).to.have.length(1);
  });

  it('no Link if non-org site is inactive', () => {
    const site = { ...testSite, isActive: false };
    wrapper = mountRouter(<SiteListItem site={site} user={testUser} />);
    expect(wrapper.find(Link)).to.have.length(0);
    expect(wrapper.find('h4')).to.have.length(1);
  });

  it('outputs an h5 with the site\'s organization', () => {
    const organizationId = testOrganization.id;
    const updatedSite = { ...testSite, organizationId };
    wrapper = mountRouter(
      <SiteListItem
        site={updatedSite}
        user={testUser}
        organization={testOrganization}
      />
    );
    expect(wrapper.find('h5')).to.have.length(1);
    expect(wrapper.find('p')).to.have.length(0); // is not sandbox
  });
  it('outputs an h5 with the site\'s sandbox organization', () => {
    const organizationId = testOrganization.id;
    const updatedSite = { ...testSite, organizationId };
    wrapper = mountRouter(
      <SiteListItem
        site={updatedSite}
        user={testUser}
        organization={{ ...testOrganization, isSandbox: true, daysUntilSandboxCleaning: 5 }}
      />
    );
    expect(wrapper.find('p')).to.have.length(1); // is sandbox
    expect(wrapper.find('h5')).to.have.length(1);
  });

  it('outputs without an h5 with the site\'s organization', () => {
    wrapper = mountRouter(
      <SiteListItem
        site={testSite}
        user={testUser}
      />
    );
    expect(wrapper.find('h5')).to.have.length(0);
  });

  it('outputs a link to the GitHub repo', () => {
    const ghLink = wrapper.find('GitHubLink');

    expect(ghLink.props().owner).to.equal('someone');
    expect(ghLink.props().repository).to.equal('something');
  });

  it('should call `removeUserFromSite` when `Remove` is clicked', () => {
    proxyquire.callThru();
    wrapper = mountRouter(<SiteListItem site={testSite} user={testUser} />);
    const clickSpy = sinon.stub(siteActions, 'removeUserFromSite').resolves();
    sinon.stub(siteActions, 'fetchSites').resolves();
    const removeSiteLink = wrapper.find('ButtonLink');

    expect(removeSiteLink.exists()).to.be.true;
    expect(removeSiteLink.contains('Remove')).to.be.true;
    removeSiteLink.simulate('click', { preventDefault: () => ({}) });
    expect(clickSpy.called).to.be.true;
  });

  it('should not have a `Remove` button when it has an organization', () => {
    wrapper = mountRouter(
      <SiteListItem
        site={testSite}
        user={testUser}
        organization={testOrganization}
      />
    );
    const removeSiteLink = wrapper.find('ButtonLink');
    expect(removeSiteLink.exists()).to.be.false;
  });
});
