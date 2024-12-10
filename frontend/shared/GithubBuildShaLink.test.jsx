import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import GithubBuildShaLink from './GithubBuildShaLink';

const defaultBuild = {
  clonedCommitSha: 'cloned_sha',
  requestedCommitSha: 'requested_sha',
};

const defaultSite = {
  owner: 'repo_owner',
  repository: 'repo_name',
};

const defaultProps = { build: defaultBuild, site: defaultSite };

describe('<GithubBuildShaLink/>', () => {
  it('renders', () => {
    const props = { ...defaultProps };
    render(<GithubBuildShaLink {...props} />);

    const anchor = screen.getByRole('link');

    expect(anchor).toHaveClass('sha-link');
    expect(anchor).toHaveAttribute('title', 'View commit on GitHub');
  });
  it('uses clonedCommitSha by default, if provided', () => {
    const props = { ...defaultProps };
    render(<GithubBuildShaLink {...props} />);

    const anchor = screen.getByRole('link');

    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/repo_owner/repo_name/commit/cloned_sha',
    );
    expect(anchor).toHaveTextContent('cloned_');
  });
  it('uses requestedCommitSha if clonedCommitSha is not provided', () => {
    const props = { build: { requestedCommitSha: '1234567890' }, site: defaultSite };
    render(<GithubBuildShaLink {...props} />);

    const anchor = screen.getByRole('link');

    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/repo_owner/repo_name/commit/1234567890',
    );
    expect(anchor).toHaveTextContent('1234567');
  });
  it('renders nothing if no sha is provided', () => {
    const props = { build: {}, site: defaultSite };
    const { container } = render(<GithubBuildShaLink {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
});
