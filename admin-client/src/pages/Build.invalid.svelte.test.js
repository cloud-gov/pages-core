import '@testing-library/jest-dom';
import { render, screen, beforeEach } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import { writable } from 'svelte/store';

vi.mock('../stores', () => {
  return {
    router: writable({ params: { id: '1234' } }),
    notification: writable(null),
  };
});

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchBuild: vi.fn(() =>
      Promise.resolve({
        id: 1234,
        branch: 'main 1',
        requestedCommitSha: 'requestedCommitSha',
        state: 'invalid',
        site: { id: 1, owner: 'admin', repository: 'repository' },
      }),
    ),
  };
});

import Build from './Build.svelte';

describe('Build component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('renders invalid build', async () => {
    render(Build);

    expect(await screen.findByText(/Build 1234/)).toBeInTheDocument();
    expect(await screen.findByText('main 1')).toBeInTheDocument();
    expect(await screen.findByText('requestedCommitSha')).toBeInTheDocument();
    expect(await screen.findByText('created at:')).toBeInTheDocument();
    expect(await screen.findByText('updated at:')).toBeInTheDocument();
    expect(await screen.queryByText('started at:')).not.toBeInTheDocument();
    expect(await screen.findByText('source:')).toBeInTheDocument();
    expect(await screen.queryByText('Live')).not.toBeInTheDocument();
    expect(await screen.queryByText('Rebuild')).not.toBeInTheDocument();
  });
});
