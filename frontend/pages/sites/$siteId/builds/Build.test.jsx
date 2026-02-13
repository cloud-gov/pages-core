import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Build from '@pages/sites/$siteId/builds/Build';
import { createTestQueryClient } from '@support/queryClient';

import api from '@util/federalistApi';

// Mocking react-router-dom's <Link> component
// to avoid rendering actual routing elements in tests.
// This prevents warnings  when <Link> is used outside a Router
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    Link: ({ to, children }) => {
      return `Link[to="${to}"] ${children}`;
    },
  };
});

describe('<Build />', () => {
  const props = {
    build: { state: '', id: 1 },
    containerRef: { current: { offsetTop: 0 } },
    latestForBranch: true,
    showBuildTasks: true,
    site: { id: 123 },
  };

  const createWrapper = createTestQueryClient();

  function testValidBuild(container) {
    // eslint-disable-next-line testing-library/no-node-access
    expect(container.querySelector('.build-info-prefix')).toHaveTextContent('#1');
    expect(screen.getByRole('button', { name: 'Rebuild' })).toBeInTheDocument();
    expect(screen.getByText(/View build logs/)).toHaveTextContent(
      'Link[to="/sites/123/builds/1/logs"]',
    );
  }

  test('it renders successful build', async () => {
    const { container } = render(
      <Build
        {...props}
        build={{
          ...props.build,
          state: 'success',
          startedAt: 1770775800000,
          branch: 'main',
        }}
      />,
      { wrapper: createWrapper() },
    );
    testValidBuild(container);
    expect(screen.getByText(/View site preview/i)).toBeInTheDocument();

    jest.spyOn(api, 'restartBuild').mockResolvedValue({});

    const user = userEvent.setup();
    const rebuildButton = screen.getByRole('button', { name: 'Rebuild' });
    await user.click(rebuildButton);

    await waitFor(() => {
      expect(api.restartBuild).toHaveBeenCalledWith(1, 123);
    });
  });

  test('it renders failed build', () => {
    const { container } = render(
      <Build
        {...props}
        build={{
          ...props.build,
          state: 'error',
          startedAt: 1770775800000,
          branch: 'main',
        }}
      />,
      { wrapper: createWrapper() },
    );
    testValidBuild(container);
  });

  test('it renders invalid build', () => {
    const { container } = render(
      <Build
        {...props}
        build={{ ...props.build, state: 'invalid', branch: 'invalid branch ~!@#$%^&*()' }}
      />,
      { wrapper: createWrapper() },
    );

    /* eslint-disable testing-library/no-container, testing-library/no-node-access */
    expect(container.querySelector('.build-info-prefix')).toHaveTextContent('#1');
    /* eslint-enable testing-library/no-container, testing-library/no-node-access */

    const logsLink = screen.getByText(/View build logs/);
    expect(logsLink).toHaveTextContent('Link[to="/sites/123/builds/1/logs"]');

    expect(screen.queryByRole('button', { name: 'Rebuild' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /View site preview/i }),
    ).not.toBeInTheDocument();
  });
});
