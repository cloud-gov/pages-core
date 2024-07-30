import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import { BranchViewLink } from '../../../frontend/components/branchViewLink';

const proxyDomain = process.env.PROXY_DOMAIN;

describe('<BranchViewLink/>', () => {
  const awsBucketName = 'test-bucket';
  const siteDomain = 'prod-url.com';
  const demoDomain = 'demo-url.com';
  const proxyOrigin = `https://${awsBucketName}.${proxyDomain}`;
  const unprovisionedS3Key = '/this/is/unprovisoned/branch';
  const viewSiteBuildCTA = 'View site preview';

  const testSite = {
    defaultBranch: 'default-branch',
    demoBranch: 'demo-branch',
    domain: `https://${siteDomain}`,
    demoDomain: `https://${demoDomain}`,
    owner: 'test-owner',
    repository: 'test-repo',
    awsBucketName,
    s3ServiceName: 'federalist-production-s3',
    domains: [
      {
        names: siteDomain,
        siteBranchConfigId: 123,
        state: 'provisioned',
      },
      {
        names: demoDomain,
        siteBranchConfigId: 256,
        state: 'provisioned',
      },
      {
        names: 'unprovisioned.gov',
        siteBranchConfigId: 411,
        state: 'pending',
      },
    ],
    siteBranchConfigs: [
      {
        branch: 'default-branch',
        id: 123,
      },
      {
        branch: 'demo-branch',
        id: 256,
      },
      {
        s3Key: unprovisionedS3Key,
        branch: 'unprovisioned-branch',
        id: 411,
      },
    ],
  };

  let props;

  beforeEach(() => {
    props = {
      branchName: 'branch-name',
      site: testSite,
    };
  });

  it("renders a link to the default branch's site", () => {
    props.branchName = 'default-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(`https://${siteDomain}`);
    expect(anchor.text()).equal(viewSiteBuildCTA);
  });

  it("renders a link to the demo branch's site", () => {
    props.branchName = 'demo-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(`https://${demoDomain}`);
    expect(anchor.text()).equal(viewSiteBuildCTA);
  });

  it('renders the preview link to site branch when the domain is not provisioned', () => {
    props.branchName = 'unprovisioned-branch';
    const wrapper = shallow(<BranchViewLink {...props} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(`${proxyOrigin}${unprovisionedS3Key}`);
    expect(anchor.text()).equal(viewSiteBuildCTA);
  });

  it('renders a preview link to the other branches', () => {
    const branchName = 'some-other-branch';
    const updatedProps = { ...props, branchName };
    const wrapper = shallow(<BranchViewLink {...updatedProps} />);
    const anchor = wrapper.find('a');
    expect(anchor.length).to.equal(1);
    expect(anchor.prop('href')).to.equal(
      `${proxyOrigin}/preview/${testSite.owner}/${testSite.repository}/${branchName}`
    );
    expect(anchor.text()).equal(viewSiteBuildCTA);
  });
});
