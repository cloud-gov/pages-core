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
    s3ServiceName: 'federalist-production-s3',
  };

  const getBuildURL = (build) => {
    if(build.site.defaultBranch === build.branchName) {
      return `${build.site.awsBucketName}.app.cloud.gov/site/${build.site.owner}/${build.site.repository}`;
    }
    if(build.site.demoBranch === build.branchName) {
      return `${build.site.awsBucketName}.app.cloud.gov/demo/${build.site.owner}/${build.site.repository}`;
    }
    return `${build.site.awsBucketName}.app.cloud.gov/preview/${build.site.owner}/${build.site.repository}/${build.branchName}`;
  }

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
    props.buildURL = getBuildURL(props);
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
    props.buildURL = getBuildURL(props);
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      'https://test-bucket.app.cloud.gov/preview/test-owner/test-repo/release_1.2.3/'
    );
    expect(anchor.text()).equal('Preview site');
  });
});
