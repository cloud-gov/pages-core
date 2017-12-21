import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';
import GitHubIconLink from '../../../../frontend/components/GitHubLink/GitHubIconLink';

proxyquire.noCallThru();

const Link = () => <div />;
const PublishedState = () => <div />;

const testSite = {
  repository: 'something',
  owner: 'someone',
  id: 1,
  viewLink: 'https://mysiteishere.biz',
};

describe('<SiteListItem />', () => {
  let Fixture;
  let wrapper;

  beforeEach(() => {
    Fixture = proxyquire('../../../../frontend/components/siteList/siteListItem', {
      'react-router': { Link },
      './publishedState': PublishedState,
    }).default;
  });

  it('outputs a published state component', () => {
    wrapper = shallow(<Fixture site={testSite} />);
    expect(wrapper.find(PublishedState).props()).to.deep.equals({ site: testSite });
    expect(wrapper.find(PublishedState)).to.have.length(1);
  });

  it('outputs a link component to direct user to the site page', () => {
    wrapper = shallow(<Fixture site={testSite} />);
    expect(wrapper.find(Link).props()).to.deep.equals({
      to: `/sites/${testSite.id}`,
      children: [testSite.owner, '/', testSite.repository],
      title: 'View site settings',
    });
    expect(wrapper.find(Link)).to.have.length(1);
  });

  it('outputs a link tag to view the site', () => {
    const siteWithBuilds = Object.assign({}, testSite, {
      builds: [{}],
    });

    wrapper = shallow(<Fixture site={siteWithBuilds} />);
    const viewLink = wrapper.find('.sites-list-item-actions a');
    expect(viewLink).to.have.length(1);
    expect(viewLink.props()).to.deep.equals({
      className: 'icon icon-view',
      href: testSite.viewLink,
      alt: `View the ${testSite.repository} site`,
      target: '_blank',
      rel: 'noopener noreferrer',
      children: 'Visit Site',
    });
  });

  it('outputs a GitHubLink', () => {

    const iconLink = wrapper.find('GitHubLink').shallow().first();
    const repoLink = iconLink.shallow().find('GitHubMark');

    expect(iconLink).to.have.length(1);
    expect(iconLink.prop('baseHref')).to.be.defined;
    expect(repoLink).to.have.length(1);
    expect(repoLink.children().find('GitHubMark')).to.have.length(1);
  });
});
