import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import GithubBuildBranchLink from './GithubBuildBranchLink';

const defaultBuild = {
  branch: 'branch_name',
};
const defaultSite = {
  owner: 'repo_owner',
  repository: 'repo_name',
};
const defaultProps = { build: defaultBuild, site: defaultSite };

describe('<GithubBuildBranchLink/>', () => {
  it('renders', () => {
    render(<GithubBuildBranchLink {...defaultProps} />);

    const anchor = screen.getByRole('link');

    expect(anchor).toHaveClass('branch-link');
    expect(anchor).toHaveAttribute('title', 'View branch on GitHub');
  });
  it('uses the build’s branch and the site’s repo and owner', () => {
    render(<GithubBuildBranchLink {...defaultProps} />);

    const anchor = screen.getByRole('link');

    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/repo_owner/repo_name/tree/branch_name',
    );
    expect(anchor).toHaveTextContent('branch_name');
  });
});
