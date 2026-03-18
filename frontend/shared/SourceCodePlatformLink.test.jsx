import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import SourceCodePlatformLink from './SourceCodePlatformLink';

describe('<SourceCodePlatformLink/>', () => {
  it('renders', () => {
    const props = {
      text: 'link text',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/owner/a-repo',
    };
    render(<SourceCodePlatformLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');

    expect(anchor).toHaveAttribute('href', 'https://github.com/owner/a-repo');
    expect(anchor).toHaveAttribute('title', 'View repository on GitHub');
    expect(anchor).toHaveTextContent('link text');

    // TODO: actually render svg with https://react-svgr.com/docs/node-api/ in tests
    // const icon = screen.getByTitle('icon-github');
    // expect(icon).toBeInTheDocument();
  });

  it('can link to a branch', () => {
    const props = {
      text: 'link text',
      branch: 'the-branch',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/owner/a-repo',
    };

    render(<SourceCodePlatformLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');
    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/owner/a-repo/tree/the-branch',
    );
    expect(anchor).toHaveAttribute('title', 'View branch on GitHub');
  });

  it('encodes the branch name', () => {
    const props = {
      text: 'boop',
      branch: '#-hash-#',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/owner/a-repo',
    };
    render(<SourceCodePlatformLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');
    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/owner/a-repo/tree/%23-hash-%23',
    );
  });

  it('links to a specific commit', () => {
    const props = {
      text: 'boop',
      sha: '123A',
      sourceCodePlatform: 'github',
      sourceCodeUrl: 'https://github.com/owner/a-repo',
    };

    render(<SourceCodePlatformLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');

    expect(anchor).toHaveAttribute('href', `https://github.com/owner/a-repo/commit/123A`);
  });
});
