import { waitFor, renderHook } from '@testing-library/react';
import nock from 'nock';
import { spy } from 'sinon';
import { createTestQueryClient } from '@support/queryClient';
import {
  getFileStorageFiles,
  getFileStorageFilesError,
  deletePublicItem,
  deletePublicItemError,
} from '@support/nocks/fileStorage';
import useFileStorage from './useFileStorage';
import { fileStorageData } from '../../test/frontend/support/data/fileStorageData';

const createWrapper = createTestQueryClient();

describe('useFileStorage', () => {
  beforeEach(() => nock.cleanAll());
  afterAll(() => nock.restore());

  it('should fetch public files successfully', async () => {
    const fileStorageId = 123;
    const path = '/';
    const sortKey = 'name';
    const sortOrder = 'asc';
    const page = '1';

    await getFileStorageFiles({
      fileStorageId,
      path,
      sortKey,
      sortOrder,
      page,
      fileStorageData,
    });

    const { result } = renderHook(
      () => useFileStorage(fileStorageId, path, sortKey, sortOrder, page),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );

    expect(result.current.data).toEqual(fileStorageData.data);
    expect(result.current.currentPage).toEqual(fileStorageData.currentPage);
    expect(result.current.totalPages).toEqual(fileStorageData.totalPages);
    expect(result.current.totalItems).toEqual(fileStorageData.totalItems);
  });

  it('should return an error when fetching public files fails', async () => {
    const fileStorageId = 123;
    const path = '/';
    const sortKey = 'name';
    const sortOrder = 'asc';
    const page = 1;

    const errorMessage = 'Failed to fetch public files';
    await getFileStorageFilesError({
      fileStorageId,
      path,
      sortKey,
      sortOrder,
      page,
      errorMessage,
    });

    const { result } = renderHook(
      () => useFileStorage(fileStorageId, path, sortKey, sortOrder, page),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toContain(errorMessage);
  });

  it('should delete an item successfully and invalidate the query', async () => {
    const fileStorageId = 123;
    const path = '/';
    const sortKey = 'name';
    const sortOrder = 'asc';
    const page = 1;
    const fileItem = { id: 1, name: 'file1.txt' };

    await deletePublicItem(fileStorageId, fileItem.id);
    await getFileStorageFiles(
      { fileStorageId, path, sortKey, sortOrder, page },
      { times: 2 },
    );

    const { result } = renderHook(
      () => useFileStorage(fileStorageId, path, sortKey, sortOrder, page),
      { wrapper: createWrapper() },
    );

    const qcSpy = spy(result.current.queryClient, 'invalidateQueries');

    await result.current.deleteItem(fileItem);
    await waitFor(() => expect(result.current.deleteSuccess).toBe(true));

    expect(
      qcSpy.calledOnceWith({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      }),
    ).toBe(true);
  });

  it('should return an error when deletion fails', async () => {
    const fileStorageId = 123;
    const path = '/';
    const sortKey = 'name';
    const sortOrder = 'asc';
    const page = 1;
    const fileItem = { id: 1, name: 'file1.txt' };

    const deleteErrorMessage = 'Failed to delete file';
    await deletePublicItemError(fileStorageId, fileItem.id, deleteErrorMessage);
    await getFileStorageFiles(
      { fileStorageId, path, sortKey, sortOrder, page },
      { times: 2 },
    );

    const { result } = renderHook(
      () => useFileStorage(fileStorageId, path, sortKey, sortOrder, page),
      { wrapper: createWrapper() },
    );

    const qcSpy = spy(result.current.queryClient, 'invalidateQueries');

    await result.current.deleteItem(fileItem).catch(() => {});

    await waitFor(() => expect(result.current.deleteError).toBeInstanceOf(Error));
    expect(result.current.deleteError.message).toContain(deleteErrorMessage);
    expect(qcSpy.notCalled).toBe(true);
  });
});
