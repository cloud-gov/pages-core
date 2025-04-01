import { waitFor, renderHook } from '@testing-library/react';
import nock from 'nock';
import { createTestQueryClient } from '@support/queryClient';
import useFileStorageLogs from './useFileStorageLogs';
import { getFileStorageLogs, getFileStorageLogsError } from '@support/nocks/fileStorage';
import { getFileStorageLogsData } from '../../test/frontend/support/data/fileStorageData';
import federalist from '@util/federalistApi';

const createWrapper = createTestQueryClient();

const props = {
  fileStorageServiceId: 123,
  page: 1,
};

describe('useFileStorageLogs', () => {
  beforeEach(() => nock.cleanAll());
  afterAll(() => nock.restore());

  it('should fetch file logs successfully', async () => {
    const expectedData = getFileStorageLogsData(props.page);
    await getFileStorageLogs({ ...props });

    const { result } = renderHook(
      () => useFileStorageLogs(props.fileStorageServiceId, props.page),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(!result.current.isPlaceholderData).toBe(true));
    await waitFor(() => expect(!result.current.isPending).toBe(true));

    expect(result.current.data).toEqual(expectedData.data);
    expect(result.current.currentPage).toEqual(expectedData.currentPage);
    expect(result.current.totalPages).toEqual(expectedData.totalPages);
    expect(result.current.totalItems).toEqual(expectedData.totalItems);
  });

  it('should fetch the second page of results correctly', async () => {
    const pageNumber = 2;
    const expectedData = getFileStorageLogsData(pageNumber);
    await getFileStorageLogs({ ...props, page: pageNumber });

    const { result } = renderHook(
      () => useFileStorageLogs(props.fileStorageServiceId, pageNumber),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(!result.current.isPlaceholderData).toBe(true));
    await waitFor(() => expect(!result.current.isPending).toBe(true));

    expect(result.current.data).toEqual(expectedData.data);
    expect(result.current.data.length).toEqual(expectedData.data.length);
    expect(result.current.currentPage).toEqual(expectedData.currentPage);
  });

  it('should return an error when fetching logs fails', async () => {
    await getFileStorageLogsError({ ...props });

    const { result } = renderHook(() => useFileStorageLogs(props.fileStorageServiceId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error.message).toBe('Failed to fetch storage logs');
  });

  it('should not fetch when fileStorageServiceId is not provided', async () => {
    // Spy on the API call
    const apiFetchSpy = jest.spyOn(federalist, 'fetchAllPublicFilesHistory');

    const { result } = renderHook(() => useFileStorageLogs(), {
      wrapper: createWrapper(),
    });

    // Check initial data
    expect(result.current.data).toEqual([]);

    // Most importantly - verify the API was never called
    expect(apiFetchSpy).not.toHaveBeenCalled();
  });

  it('should refetch when page changes', async () => {
    await getFileStorageLogs({ ...props });
    const { result, rerender } = renderHook(
      ({ page }) => useFileStorageLogs(props.fileStorageServiceId, page),
      {
        wrapper: createWrapper(),
        initialProps: { page: 1 },
      },
    );

    await waitFor(() => expect(!result.current.isPending).toBe(true));

    await getFileStorageLogs({ ...props, page: 2 });
    rerender({ page: 2 });

    await waitFor(() => expect(result.current.currentPage).toBe(2));
  });
});
