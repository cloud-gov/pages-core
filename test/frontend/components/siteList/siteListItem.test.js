import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';
import siteActions from '../../../../frontend/actions/siteActions';

proxyquire.noCallThru();

const Link = () => <div />;
const PublishedState = () => <div />;
const RepoLastVerified = () => <div />;

const testSite = {
  repository: 'something',
  owner: 'someone',
  id: 1,
  viewLink: 'https://mysiteishere.biz',
};

const testUser = {
  username: 'not-owner',
  id: 4,
  email: 'not-owner@beep.gov',
  updatedAt: new Date(new Date() - (10 * 24 * 60 * 60 * 1000)).toString(),
};

describe('<SiteListItem />', () => {
  let Fixture;
  let wrapper;

  beforeEach(() => {
    Fixture = proxyquire('../../../../frontend/components/siteList/siteListItem', {
      '@reach/router': { Link },
      './publishedState': PublishedState,
      './repoLastVerified': RepoLastVerified,
      '../icons': { IconView: 'IconView' },
    }).default;
  });

  it('outputs a published state component', () => {
    wrapper = shallow(<Fixture site={testSite} user={testUser} />);
    expect(wrapper.find(PublishedState).props()).to.deep.equals({ site: testSite });
    expect(wrapper.find(PublishedState)).to.have.length(1);
  });

  it('outputs a repo last verified component', () => {
    wrapper = shallow(<Fixture site={testSite} user={testUser} />);
    expect(wrapper.find(RepoLastVerified).props()).to.deep.equals({
      site: testSite,
      userUpdated: testUser.updatedAt,
    });
    expect(wrapper.find(RepoLastVerified)).to.have.length(1);
  });

  it('outputs a link component to direct user to the site page', () => {
    wrapper = shallow(<Fixture site={testSite} user={testUser} />);
    expect(wrapper.find(Link).props()).to.deep.equals({
      to: `/sites/${testSite.id}`,
      children: `${testSite.owner}/${testSite.repository}`,
      title: 'View site settings',
    });
    expect(wrapper.find(Link)).to.have.length(1);
  });

  it('outputs a link tag to view the site', () => {
    const siteWithBuilds = Object.assign({}, testSite, {
      builds: [{}],
    });

    wrapper = shallow(<Fixture site={siteWithBuilds} user={testUser} />);
    const viewLink = wrapper.find('.sites-list-item-actions a');
    expect(viewLink).to.have.length(1);
    expect(viewLink.props()).to.contain({
      href: testSite.viewLink,
      alt: `View the ${testSite.repository} site`,
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'view-site-link',
    });
    expect(viewLink.text()).to.equal('View site ');
  });

  it('outputs a link to the GitHub repo', () => {
    const ghLink = wrapper.find('GitHubLink');

    expect(ghLink.props().owner).to.equal('someone');
    expect(ghLink.props().repository).to.equal('something');
  });

  it('should call `removeUserFromSite` when `Remove` is clicked', () => {
    proxyquire.callThru();
    wrapper = shallow(<Fixture site={testSite} user={testUser} />);
    const clickSpy = stub(siteActions, 'removeUserFromSite').resolves();
    stub(siteActions, 'fetchSites').resolves();
    const removeSiteLink = wrapper.find('ButtonLink').shallow();

    expect(removeSiteLink.exists()).to.be.true;
    expect(removeSiteLink.contains('Remove')).to.be.true;
    removeSiteLink.simulate('click', { preventDefault: () => ({}) });
    expect(clickSpy.called).to.be.true;
  });
});
