import { waitFor, renderHook } from '@testing-library/react';
import nock from 'nock';
import { spy } from 'sinon';
import { createTestQueryClient } from '@support/queryClient';
import { getSiteBuilds, getSiteBuildsError, postSiteBuild } from '@support/nocks';
import { useBuilds, useRebuild } from './useBuilds';

const createWrapper = createTestQueryClient();

function checkForLatest(builds) {
  const hasChecked = [];

  return builds.map((build) => {
    const { latestForBranch, branch, completedAt } = build;

    if (latestForBranch && completedAt) {
      expect(!hasChecked.includes(branch)).toBe(true);
      hasChecked.push(branch);
    }

    if (!latestForBranch && completedAt) {
      expect(hasChecked.includes(branch)).toBe(true);
    }
  });
}

describe('useBuilds', () => {
  beforeEach(() => nock.cleanAll());
  afterAll(() => nock.restore());

  it('should fetch builds based on site id', async () => {
    const siteId = 1;
    await getSiteBuilds(siteId);

    const { result } = renderHook(() => useBuilds(siteId), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data.length > 0).toBe(true);
    checkForLatest(result.current.data);
  });

  it('should return error', async () => {
    const siteId = 1;
    await getSiteBuildsError(siteId, 'Something happened');

    const { result } = renderHook(() => useBuilds(siteId), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );

    expect(result.current.error instanceof Error).toBe(true);
  });

  it('should mutate the builds on rebuild and call scrollIntoView', async () => {
    const siteId = 1;
    const buildId = 1;
    Object.defineProperty(window, 'scrollY', {
      value: 500,
    });
    const ref = {
      current: {
        scrollIntoView: jest.fn(),
        offsetTop: 100,
      },
    };

    postSiteBuild(siteId, buildId);

    const { result } = renderHook(() => useRebuild(siteId, buildId, ref), {
      wrapper: createWrapper(),
    });

    const qcSpy = spy(result.current.queryClient, 'invalidateQueries');

    const isFunction = result.current.rebuildBranch instanceof Function;
    expect(isFunction).toBe(true);

    await result.current.rebuildBranch();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(ref.current.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(qcSpy.calledOnceWith({ queryKey: ['builds', parseInt(siteId, 10)] })).toBe(
      true,
    );
  });

  it('should mutate the builds on rebuild and not scrollIntoView', async () => {
    const siteId = 1;
    const buildId = 1;
    Object.defineProperty(window, 'scrollY', {
      value: 200,
    });
    const ref = {
      current: {
        scrollIntoView: jest.fn(),
        offsetTop: 100,
      },
    };

    postSiteBuild(siteId, buildId);

    const { result } = renderHook(() => useRebuild(siteId, buildId, ref), {
      wrapper: createWrapper(),
    });

    const qcSpy = spy(result.current.queryClient, 'invalidateQueries');

    const isFunction = result.current.rebuildBranch instanceof Function;
    expect(isFunction).toBe(true);

    await result.current.rebuildBranch();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(ref.current.scrollIntoView).toHaveBeenCalledTimes(0);
    expect(qcSpy.calledOnceWith({ queryKey: ['builds', parseInt(siteId, 10)] })).toBe(
      true,
    );
  });
});
