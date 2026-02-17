import '@testing-library/jest-dom';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SiteBuildList from '@pages/sites/$siteId/builds/index';
import api from '@util/federalistApi';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import actions from '@actions/alertActions';

global.fetch = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const createWrapper = (siteId = '123') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  /* eslint-disable react/prop-types */
  const Wrapper = ({ children }) => (
    <Provider
      store={{
        getState: () => ({
          sites: { 123: { id: '123', organizationId: 'org-1' } },
          organizations: { 'org-1': { id: 'org-1', name: 'Test Org' } },
        }),
        subscribe: jest.fn(),
        dispatch: jest.fn(),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/sites/${siteId}/builds`]}>
          <Routes>
            <Route path="/sites/:id/builds" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  Wrapper.displayName = 'TestWrapper';

  return Wrapper;
};

describe('<Build />', () => {
  test('renders build list and displays error for invalid build rebuild', async () => {
    useSelector.mockImplementation((selector) =>
      selector({
        sites: {
          data: [{ id: 123, name: 'Test Site', organizationId: 'org-1' }],
        },
        organizations: {
          data: [{ id: 'org-1', name: 'Test Org' }],
        },
      }),
    );

    jest.spyOn(api, 'fetchBuilds').mockResolvedValue([
      { id: 1, branch: 'main', state: 'success', completedAt: new Date() },
      { id: 3, branch: 'invalid branch name', state: 'invalid', completedAt: new Date() },
    ]);

    render(<SiteBuildList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
    });

    expect(screen.getByText('invalid branch name')).toBeInTheDocument();

    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      statusText: '',
      json: function () {
        return Promise.resolve(
          '{ "message": "Invalid branch name.",' + '"errors": "Invalid branch name."}',
        );
      },
      text: function () {
        return Promise.resolve(
          '{ "message": "Invalid branch name.",' + '"errors": "Invalid branch name."}',
        );
      },
    });
    const actionsHttpError = jest.spyOn(actions, 'httpError');

    const user = userEvent.setup();
    const rebuildButton = screen.getByRole('button', { name: 'Rebuild' });
    await user.click(rebuildButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/v0/build/', {
        body: '{"buildId":1,"siteId":123}',
        credentials: 'same-origin',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-csrf-token': undefined,
        },
        method: 'POST',
      });
    });

    expect(actionsHttpError).toHaveBeenCalledWith('Invalid branch name.');
  });
});
