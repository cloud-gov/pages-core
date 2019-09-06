import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { BranchViewLink } from '../../../frontend/components/branchViewLink';

describe('<BranchViewLink/>', () => {
  const testSite = {
    defaultBranch: 'default-branch',
    demoBranch: 'demo-branch',
    viewLink: 'https://prod-url.com',
    demoViewLink: 'https://demo-url.com',
    owner: 'test-owner',
    repository: 'test-repo',
    awsBucketName: 'test-bucket',
  };

  let props;

  beforeEach(() => {
    props = {
      branchName: 'branch-name',
      site: testSite,
      // previewHostname: 'https://preview-hostname.com',
    };
  });

  it('renders a link to the default branch\'s site', () => {
    props.branchName = 'default-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal('https://prod-url.com');
    expect(anchor.text()).equal('View site');
  });

  it('renders a link to the demo branch\'s site', () => {
    props.branchName = 'demo-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal('https://demo-url.com');
    expect(anchor.text()).equal('View demo');
  });

  it('renders a preview link to the other branches', () => {
    props.branchName = 'some-other-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://test-bucket.app.cloud.gov/preview/test-owner/test-repo/some-other-branch/'
    );
    expect(anchor.text()).equal('Preview site');
  });

  it('allows some special characters', () => {
    props.branchName = 'release_1.2.3';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://test-bucket.app.cloud.gov/preview/test-owner/test-repo/release_1.2.3/'
    );
    expect(anchor.text()).equal('Preview site');
  });

  it('renders a preview link to the other branches created last year', () => {
    props.branchName = 'some-another-branch';
    props.completedAt = '2019-01-01'
    props.site.createdAt = '2019-01-01'
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://federalist-proxy.app.cloud.gov/preview/test-owner/test-repo/some-another-branch/'
    );
    expect(anchor.text()).equal('Preview site');
  });

  it('renders a preview link to the other branches', () => {
    props.branchName = 'some-other-other-branch';
    props.completedAt = '2019-10-01'
    props.site.createdAt = '2019-01-01'
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://test-bucket.app.cloud.gov/preview/test-owner/test-repo/some-other-other-branch/'
    );
    expect(anchor.text()).equal('Preview site');
  });

  it('renders a preview link to the other branches', () => {
    props.branchName = 'some-other-another-branch';
    props.completedAt = '2019-01-01'
    props.site.createdAt = '2019-10-01'
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://test-bucket.app.cloud.gov/preview/test-owner/test-repo/some-other-another-branch/'
    );
    expect(anchor.text()).equal('Preview site');
  });
});
