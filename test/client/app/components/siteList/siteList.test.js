import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const SiteListItem = () => <div></div>;
const LinkButton = () => <div></div>;

const NO_SITE_TEXT = 'No sites yet.';

// sites can be empty as the test is rendering empty divs for children.
const STORE_WITH_SITES = {sites: [{}, {}, {}]};
const STORE_WITH_NO_SITES = {sites: []};

describe('<SiteList />', () => {
  let Fixture;
  let wrapper;

  beforeEach(() => {
    Fixture = proxyquire('../../../../../assets/app/components/siteList/siteList', {
      './siteListItem': SiteListItem,
      '../linkButton': LinkButton
    }).default;
  });

  describe('when no sites are received as props', () => {
    beforeEach(() => {
      wrapper = shallow(<Fixture storeState={STORE_WITH_NO_SITES} />);
    });

    it('renders an h1 element with the title', () => {
      expect(wrapper.find('div.header-title > h1')).to.have.length(1);
    });

    it('always renders 2 `add new site` button', () => {
      expect(wrapper.find(LinkButton)).to.have.length(2);
    });

    it('renders fallback content when user has no sites', () => {
      const fallbackEl = wrapper.find('h1').filterWhere((el) => {
        return el.text() === NO_SITE_TEXT;
      });

      expect(fallbackEl.text()).to.equal(NO_SITE_TEXT)
    });
  });

  describe('when sites are received as props', () => {
    beforeEach(() => {
      wrapper = shallow(<Fixture storeState={STORE_WITH_SITES}/>);
    });

    it('renders a container for the list of sites', () => {
      expect(wrapper.find('.sites-list')).to.have.length(1);
    });

    it('renders a SiteListItem component for each site in the list', () => {
      expect(wrapper.find(SiteListItem)).to.have.length(3);
    });
  });
});
