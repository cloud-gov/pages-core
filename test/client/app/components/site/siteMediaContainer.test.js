import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { mock } from 'sinon';
import proxyquire from 'proxyquire';

proxyquire.noCallThru();

const MediaThumbnail = () => <div></div>;

const Fixture = proxyquire('../../../../../assets/app/components/site/siteMediaContainer', {
  '../../siteActions': {},
  '../mediaThumbnail': MediaThumbnail
}).default;

describe('<SiteMediaContainer/>', () => {
  let wrapper;

  it('returns a fallback if no media assets as passed as props', () => {
    wrapper = shallow(<Fixture />);
    expect(wrapper.find('h1')).to.have.length(1);
  });

  describe('with assets', () => {
    beforeEach(() => {
      const props = {
        assets: [{}]
      }

      wrapper = shallow(<Fixture {...props} />);
    });

    it ('returns a list of assets', () => {
      expect(wrapper.find(MediaThumbnail)).to.have.length(1);
    });

    it('passes the correct props to its children', () => {
      const expectedProps = {
        asset: {}
      };

      const actualProps = wrapper.find(MediaThumbnail).props();

      expect(actualProps).to.deep.equal(expectedProps);
    });
  });
})
