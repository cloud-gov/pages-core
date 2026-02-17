import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createTestQueryClient } from '@support/queryClient';
import api from '@util/federalistApi';
import BranchConfigs from '@pages/sites/$siteId/settings/BranchConfigs';
import userEvent from '@testing-library/user-event';
import actions from '@actions/alertActions';
import notificationActions from '@actions/notificationActions';

function getSaveButtonForArea(buttonName) {
  const areaButton = screen.getByRole('button', { name: buttonName });
  const contentId = areaButton.getAttribute('aria-controls');
  // eslint-disable-next-line testing-library/no-node-access
  const expandableDiv = document.getElementById(contentId);
  const saveButton = within(expandableDiv).getByRole('button', {
    name: 'Save',
    hidden: true,
  });
  return saveButton;
}

describe('<BranchConfig />', () => {
  const createMockResponse = (data, status) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
    text: async () => data,
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch?.mockClear();
  });

  test('prevents from creating live site config with invalid branch name', async () => {
    global.fetch = jest.fn();

    const createWrapper = createTestQueryClient();
    const liveSiteBranch = 'main 1';
    jest
      .spyOn(api, 'fetchSiteBranchConfigs')
      .mockResolvedValue([
        { id: null, branch: liveSiteBranch, config: {}, context: 'site' },
      ]);

    await render(<BranchConfigs siteId={1} hash={'jfslWJFG'} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(liveSiteBranch)).toBeInTheDocument();
    });

    const data =
      '{"message":"An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, ' +
      'and hyphens.","status":400}';
    global.fetch.mockResolvedValue(createMockResponse(data, 422));
    jest.spyOn(actions, 'httpError');
    jest.spyOn(notificationActions, 'success');

    const user = userEvent.setup();
    await user.click(getSaveButtonForArea(/Live site/i));

    expect(global.fetch).toHaveBeenCalledWith('/v0/site/1/branch-config', {
      body: '{"branch":"main 1","config":"{}\\n","context":"site","throwError":true}',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': undefined,
      },
      method: 'POST',
    });

    const error =
      'An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, and hyphens.';
    expect(actions.httpError).toHaveBeenCalledWith(error);
    expect(notificationActions.success).not.toHaveBeenCalled();
  });

  test('prevents from creating demo site config with invalid branch name', async () => {
    global.fetch = jest.fn();

    const createWrapper = createTestQueryClient();
    const demoSiteBranch = 'main 1';
    jest
      .spyOn(api, 'fetchSiteBranchConfigs')
      .mockResolvedValue([
        { id: null, branch: demoSiteBranch, config: {}, context: 'demo' },
      ]);

    await render(<BranchConfigs siteId={1} hash={'jfslWJFG'} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(demoSiteBranch)).toBeInTheDocument();
    });

    const data =
      '{"message":"An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, ' +
      'and hyphens.","status":400}';
    global.fetch.mockResolvedValue(createMockResponse(data, 422));
    jest.spyOn(actions, 'httpError');
    jest.spyOn(notificationActions, 'success');

    const user = userEvent.setup();
    await user.click(getSaveButtonForArea(/Demo site/i));

    expect(global.fetch).toHaveBeenCalledWith('/v0/site/1/branch-config', {
      body: '{"branch":"main 1","config":"{}\\n","context":"demo","throwError":true}',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': undefined,
      },
      method: 'POST',
    });

    const error =
      'An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, and hyphens.';
    expect(actions.httpError).toHaveBeenCalledWith(error);
    expect(notificationActions.success).not.toHaveBeenCalled();
  });

  ///
  test('prevents from updatinf live site config with invalid branch name', async () => {
    global.fetch = jest.fn();

    const createWrapper = createTestQueryClient();
    const liveSiteBranch = 'main 1';
    jest
      .spyOn(api, 'fetchSiteBranchConfigs')
      .mockResolvedValue([
        { id: 1, branch: liveSiteBranch, config: {}, context: 'site' },
      ]);

    await render(<BranchConfigs siteId={1} hash={'jfslWJFG'} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(liveSiteBranch)).toBeInTheDocument();
    });

    const data =
      '{"message":"An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, ' +
      'and hyphens.","status":400}';
    global.fetch.mockResolvedValue(createMockResponse(data, 422));
    jest.spyOn(actions, 'httpError');
    jest.spyOn(notificationActions, 'success');

    const user = userEvent.setup();
    await user.click(getSaveButtonForArea(/Live site/i));

    expect(global.fetch).toHaveBeenCalledWith('/v0/site/1/branch-config/1', {
      body: '{"branch":"main 1","config":"{}\\n","context":"site","throwError":true}',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': undefined,
      },
      method: 'PUT',
    });

    const error =
      'An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, and hyphens.';
    expect(actions.httpError).toHaveBeenCalledWith(error);
    expect(notificationActions.success).not.toHaveBeenCalled();
  });

  test('prevents from updating demo site config with invalid branch name', async () => {
    global.fetch = jest.fn();

    const createWrapper = createTestQueryClient();
    const demoSiteBranch = 'main 1';
    jest
      .spyOn(api, 'fetchSiteBranchConfigs')
      .mockResolvedValue([
        { id: 1, branch: demoSiteBranch, config: {}, context: 'demo' },
      ]);

    await render(<BranchConfigs siteId={1} hash={'jfslWJFG'} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(demoSiteBranch)).toBeInTheDocument();
    });

    const data =
      '{"message":"An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, ' +
      'underscores, and hyphens.","status":400}';
    global.fetch.mockResolvedValue(createMockResponse(data, 422));
    jest.spyOn(actions, 'httpError');
    jest.spyOn(notificationActions, 'success');

    const user = userEvent.setup();
    await user.click(getSaveButtonForArea(/Demo site/i));

    expect(global.fetch).toHaveBeenCalledWith('/v0/site/1/branch-config/1', {
      body: '{"branch":"main 1","config":"{}\\n","context":"demo","throwError":true}',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-csrf-token': undefined,
      },
      method: 'PUT',
    });

    const error =
      'An error occurred updating the site branch config: ' +
      'Validation error: Invalid branch name — ' +
      'branches can only contain alphanumeric characters, underscores, and hyphens.';
    expect(actions.httpError).toHaveBeenCalledWith(error);
    expect(notificationActions.success).not.toHaveBeenCalled();
  });
});
