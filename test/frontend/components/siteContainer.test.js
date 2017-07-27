import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { SiteContainer } from '../../../frontend/components/siteContainer';

let props;

describe('<SiteContainer/>', () => {
  beforeEach(() => {
    props = {
      storeState: {
        alert: {},
        sites: {
          isLoading: false,
          data: [{
            id: 1,
            defaultBranch: 'master',
            engine: 'jekyll',
            owner: '18f',
            publishedAt: '2017-06-08T20:53:14.363Z',
          }],
        },
      },
      location: {
        pathname: '',
      },
      params: {
        id: '1',
        branch: 'branch',
        fileName: 'boop.txt',
      },
    };
  });

  it('renders a LoadingIndicator while sites are loading', () => {
    props.storeState.sites = {
      isLoading: true,
    };
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('LoadingIndicator')).to.have.length(1);
  });

  it('renders after sites have loaded', () => {
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('SideNav')).to.have.length(1);
    expect(wrapper.find('AlertBanner')).to.have.length(1);
    expect(wrapper.find('PagesHeader')).to.have.length(1);
  });

  it('renders an error after sites have loaded but no matching site', () => {
    props.params.id = '999';
    const wrapper = shallow(<SiteContainer {...props} />);
    expect(wrapper.find('LoadingIndicator')).to.have.length(0);
    expect(wrapper.find('.usa-alert-error')).to.have.length(1);
  });
});
