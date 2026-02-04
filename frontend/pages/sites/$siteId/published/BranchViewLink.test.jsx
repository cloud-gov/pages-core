import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BranchViewLink } from './BranchViewLink';

const proxyDomain = process.env.PROXY_DOMAIN;

describe('<BranchViewLink/>', () => {
  const awsBucketName = 'test-bucket';
  const siteDomain = 'prod-url.com';
  const demoDomain = 'demo-url.com';
  const proxyOrigin = `https://${awsBucketName}.${proxyDomain}`;
  const unprovisionedS3Key = '/this/is/unprovisoned/branch';

  const defaultBranch = 'default-branch';
  const demoBranch = 'demo-branch';
  const VIEW_BUILD = 'View site preview';

  const testSite = {
    defaultBranch,
    demoBranch,
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
        branch: defaultBranch,
        id: 123,
      },
      {
        branch: demoBranch,
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
    render(<BranchViewLink {...props} />);
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', `https://${siteDomain}`);
    expect(anchor).toHaveTextContent(VIEW_BUILD);
  });

  it("renders a link to the demo branch's site", () => {
    props.branchName = 'demo-branch';
    render(<BranchViewLink {...props} />);
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', `https://${demoDomain}`);
    expect(anchor).toHaveTextContent(VIEW_BUILD);
  });

  it('renders the preview link to site branch when the domain is not provisioned', () => {
    props.branchName = 'unprovisioned-branch';
    render(<BranchViewLink {...props} />);
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', `${proxyOrigin}${unprovisionedS3Key}`);
    expect(anchor).toHaveTextContent(VIEW_BUILD);
  });

  it('renders a preview link to the other branches', () => {
    const branchName = 'some-other-branch-with-special_characters-###';
    const branchEncoded = 'some-other-branch-with-special_characters-%23%23%23';
    const updatedProps = { ...props, branchName };
    render(<BranchViewLink {...updatedProps} />);
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute(
      'href',
      `${proxyOrigin}/preview/${testSite.owner}/${testSite.repository}/${branchEncoded}`,
    );
    expect(anchor).toHaveTextContent(VIEW_BUILD);
  });
});
