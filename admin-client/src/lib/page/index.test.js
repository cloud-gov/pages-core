import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('vendored page router', () => {
  beforeEach(async () => {
    vi.resetModules();
    window.history.replaceState(null, '', '/');
    document.body.innerHTML = '';
  });

  test('registers routes and dispatches with params on start', async () => {
    window.history.replaceState(null, '', '/users/123?tab=settings#profile');

    const { default: page } = await import('./index.js');
    const handler = vi.fn();

    page('/users/:id', (ctx) => {
      handler({
        path: ctx.path,
        pathname: ctx.pathname,
        params: ctx.params,
        querystring: ctx.querystring,
        hash: ctx.hash,
      });
    });

    page();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      path: '/users/123?tab=settings',
      pathname: '/users/123',
      params: { id: '123' },
      querystring: 'tab=settings',
      hash: 'profile',
    });
  });

  test('supports redirect and navigation through the singleton export', async () => {
    const { default: page } = await import('./index.js');
    const destination = vi.fn();

    page('/from', () => page.redirect('/to'));
    page('/to', destination);
    page.start({ dispatch: false });

    page.show('/from');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(destination).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/to');
  });
});
