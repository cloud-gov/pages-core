import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy, stub, restore } from 'sinon';
import '@testing-library/jest-dom';
import globals from '../globals';

import api from '@util/federalistApi';
import GithubAuthButton from './GithubAuthButton';

const BUTTON_TEXT = `Connect with GitHub`;
const text = 'Hello World';

// We need to create the MessageEvent to set the origin
// and data when testing
// https://github.com/jsdom/jsdom/issues/2745#issuecomment-1207414024
function createPostMessageEvent(data, origin) {
  return new MessageEvent('message', {
    source: window,
    origin,
    data,
  });
}

function createStubs() {
  const onFailure = spy();
  const onSuccess = spy();
  const apiStub = stub(api, 'revokeApplicationGrant').resolves();
  const focusStub = stub().resolves();
  const closeStub = stub().returns();
  const windowStub = stub(window, 'open').returns({
    focus: focusStub,
    close: closeStub,
  });

  return {
    onFailure,
    onSuccess,
    apiStub,
    focusStub,
    closeStub,
    windowStub,
  };
}

describe('<GithubAuthButton/>', () => {
  let onFailure;
  let onSuccess;
  let apiStub;
  let focusStub;
  let closeStub;
  let windowStub;

  const user = userEvent.setup();

  beforeAll(() => {
    // Set window origin based on globals APP_HOSTNAME
    window['origin'] = globals.APP_HOSTNAME;

    // Set screen height and width
    window['screen'] = {
      width: 1200,
      height: 1000,
    };
  });

  beforeEach(() => {
    ({ onFailure, onSuccess, apiStub, focusStub, closeStub, windowStub } = createStubs());
  });

  afterEach(() => restore());

  it('renders', () => {
    const props = { onFailure, onSuccess, text };
    render(<GithubAuthButton {...props} />);

    expect(screen.getByText(text)).toBeTruthy();

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(BUTTON_TEXT);

    expect(onFailure.notCalled).toBe(true);
    expect(onSuccess.notCalled).toBe(true);
  });

  it('opens window, calls the revokeFirst and then succeeds', async () => {
    const props = { onFailure, onSuccess, text, revokeFirst: true };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.calledOnce).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('success', window.origin)),
    );

    expect(closeStub.calledOnce).toBe(true);
    expect(onSuccess.calledOnce).toBe(true);
    expect(onFailure.notCalled).toBe(true);
  });

  it('opens window with revokeFirst and fails authorize', async () => {
    const props = { onFailure, onSuccess, text, revokeFirst: true };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.calledOnce).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('fail', window.origin)),
    );

    expect(closeStub.notCalled).toBe(true);
    expect(onSuccess.notCalled).toBe(true);
    expect(onFailure.calledOnce).toBe(true);
  });

  it('opens window with revokeFirst and fails origin', async () => {
    const props = { onFailure, onSuccess, text, revokeFirst: true };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.calledOnce).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('success', 'http://wrongorigin')),
    );

    expect(closeStub.notCalled).toBe(true);
    expect(onSuccess.notCalled).toBe(true);
    expect(onFailure.calledOnce).toBe(true);
  });

  it('opens window without revokeFirst and then succeeds', async () => {
    const props = { onFailure, onSuccess, text };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.notCalled).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('success', window.origin)),
    );

    expect(closeStub.calledOnce).toBe(true);
    expect(onSuccess.calledOnce).toBe(true);
    expect(onFailure.notCalled).toBe(true);
  });

  it('opens window without revokeFirst and fails authorize', async () => {
    const props = { onFailure, onSuccess, text };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.notCalled).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('fail', window.origin)),
    );

    expect(closeStub.notCalled).toBe(true);
    expect(onSuccess.notCalled).toBe(true);
    expect(onFailure.calledOnce).toBe(true);
  });

  it('opens window without revokeFirst and fails origin', async () => {
    const props = { onFailure, onSuccess, text };
    render(<GithubAuthButton {...props} />);

    await user.click(screen.getByRole('button'));

    expect(apiStub.notCalled).toBe(true);
    await waitFor(() => expect(windowStub.calledOnce).toBe(true));
    await waitFor(() => expect(focusStub.calledOnce).toBe(true));
    await waitFor(() =>
      window.dispatchEvent(createPostMessageEvent('success', 'http://wrongorigin')),
    );

    expect(closeStub.notCalled).toBe(true);
    expect(onSuccess.notCalled).toBe(true);
    expect(onFailure.calledOnce).toBe(true);
  });
});
