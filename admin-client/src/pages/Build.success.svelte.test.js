import '@testing-library/jest-dom';
import { fireEvent, render, screen, beforeEach } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { writable } from 'svelte/store';
import { waitFor } from '@testing-library/react';

vi.mock('../stores', async (importOriginal) => {
  const actual = await importOriginal();

  const notification = writable(null);
  notification.setError = vi.fn();

  return {
    ...actual,
    router: writable({ params: { id: '123' } }),
    notification,
  };
});
import { notification } from '../stores';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchBuild: vi.fn(() =>
      Promise.resolve({
        id: 123,
        branch: 'main',
        requestedCommitSha: 'requestedCommitSha',
        state: 'success',
        site: { id: 1, owner: 'admin', repository: 'repository' },
      }),
    ),
  };
});
import Build from './Build.svelte';

/* eslint-disable-next-line no-undef */
global.fetch = vi.fn();

describe('Build component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  test('renders successful build', async () => {
    render(Build);

    expect(await screen.findByText(/Build 123/)).toBeInTheDocument();
    expect(await screen.findByText('main')).toBeInTheDocument();
    expect(await screen.findByText('requestedCommitSha')).toBeInTheDocument();
    expect(await screen.findByText('created at:')).toBeInTheDocument();
    expect(await screen.findByText('updated at:')).toBeInTheDocument();
    expect(await screen.findByText('started at:')).toBeInTheDocument();
    expect(await screen.findByText('source:')).toBeInTheDocument();
    expect(await screen.findByText('Live')).toBeInTheDocument();
    const rebuildButton = await screen.getByRole('button', { name: 'Rebuild' });
    expect(rebuildButton).toBeInTheDocument();

    /* eslint-disable-next-line no-undef */
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          message: 'Invalid branch name.',
          errors: 'Invalid branch name.',
        }),
    });
    await fireEvent.click(rebuildButton);

    await waitFor(() => {
      /* eslint-disable-next-line no-undef */
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/admin/builds', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': null,
        },
        mode: 'cors',
        method: 'POST',
        body: '{"buildId":"123","siteId":1}',
      });
      expect(notification.setError).toHaveBeenCalledWith(
        'Unable to rebuild 123: Invalid branch name.',
      );
      expect(notification.setError).toHaveBeenCalledTimes(1);
    });
  });
});
