import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import GitHubLink from './GitHubLink';

describe('<GitHubLink/>', () => {
  it('renders', () => {
    const props = { owner: 'owner', repository: 'a-repo', text: 'link text' };
    render(<GitHubLink {...props} />);

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
      owner: 'pumpkin-pie',
      repository: 'candle',
      branch: 'the-branch',
    };

    render(<GitHubLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');
    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/pumpkin-pie/candle/tree/the-branch',
    );
    expect(anchor).toHaveAttribute('title', 'View branch on GitHub');
  });

  it('encodes the branch name', () => {
    const props = {
      text: 'boop',
      owner: 'spam',
      repository: 'potato',
      branch: '#-hash-#',
    };
    render(<GitHubLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');
    expect(anchor).toHaveAttribute(
      'href',
      'https://github.com/spam/potato/tree/%23-hash-%23',
    );
  });

  it('links to a specific commit', () => {
    const props = {
      text: 'boop',
      owner: 'zookeeni',
      repository: 'veggies',
      sha: '123A',
    };

    render(<GitHubLink {...props} />);

    const anchor = screen.getByRole('link');
    expect(anchor).toHaveClass('repo-link');

    const commitUrl = `https://github.com/${props.owner}/${props.repository}/commit/${props.sha}`;

    expect(anchor).toHaveAttribute('href', commitUrl);
  });
});
