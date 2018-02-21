import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';

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
      '../icons': { IconView: 'IconView' },
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
});
