import { waitFor, renderHook, act } from '@testing-library/react';
import nock from 'nock';
import sinon from 'sinon';
import { createTestQueryClient } from '@support/queryClient';
import {
  getFileStorageFiles,
  getFileStorageFilesError,
  deletePublicItem,
  deletePublicItemError,
  createPublicDirectory,
  createPublicDirectoryError,
} from '@support/nocks/fileStorage';
import useFileStorage from './useFileStorage';
import { getFileStorageData } from '../../test/frontend/support/data/fileStorageData';
import federalist from '@util/federalistApi';

const createWrapper = createTestQueryClient();

const props = {
  fileStorageId: 123,
  path: '/',
  sortKey: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
};
describe('useFileStorage', () => {
  beforeEach(() => nock.cleanAll());
  afterEach(() => sinon.restore());
  afterAll(() => nock.restore());

  it('should fetch public files successfully', async () => {
    const expectedData = getFileStorageData(props.page);
    await getFileStorageFiles({ ...props });

    const { result } = renderHook(() => useFileStorage(...Object.values(props)), {
      wrapper: createWrapper(),
    });
    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );
    expect(result.current.data).toEqual(expectedData.data);
    expect(result.current.currentPage).toEqual(expectedData.currentPage);
    expect(result.current.totalPages).toEqual(expectedData.totalPages);
    expect(result.current.totalItems).toEqual(expectedData.totalItems);
  });

  it('should fetch public files successfully even in a nested folder', async () => {
    const nestedFolder = '/subfolder';
    const expectedData = getFileStorageData(props.page);

    await getFileStorageFiles({ ...props, path: nestedFolder });

    const { result } = renderHook(
      () => useFileStorage(props.fileStorageId, nestedFolder),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );

    expect(result.current.data).toEqual(expectedData.data);
    expect(result.current.currentPage).toEqual(expectedData.currentPage);
    expect(result.current.totalPages).toEqual(expectedData.totalPages);
    expect(result.current.totalItems).toEqual(expectedData.totalItems);
  });

  it('should fetch the second page of results correctly', async () => {
    const pageNumber = 2;
    const expectedData = getFileStorageData(pageNumber);

    await getFileStorageFiles({ ...props, page: pageNumber });

    const { result } = renderHook(
      () =>
        useFileStorage(
          props.fileStorageId,
          props.path,
          props.sortKey,
          props.sortOrder,
          pageNumber,
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(!result.current.isPending && !result.current.isPlaceholderData).toBe(true),
    );
    expect(result.current.data).toEqual(expectedData.data);
    expect(result.current.currentPage).toEqual(expectedData.currentPage);
    expect(result.current.totalPages).toEqual(expectedData.totalPages);
    expect(result.current.totalItems).toEqual(expectedData.totalItems);
  });

  it('should return an error when fetching public files fails', async () => {
    const errorMessage = 'Failed to fetch public files';
    await getFileStorageFilesError({ ...props, errorMessage });
    await getFileStorageFiles({ ...props }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.defaultError).toBeInstanceOf(Error));

    expect(result.current.defaultError).toBeInstanceOf(Error);
    expect(result.current.defaultError.message).toContain(errorMessage);
  });

  it('should delete an item successfully and invalidate the query', async () => {
    const fileItem = { id: 1, name: 'file1.txt' };

    await deletePublicItem(props.fileStorageId, fileItem.id);
    await getFileStorageFiles({ ...props }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    const qcSpy = sinon.spy(result.current.queryClient, 'invalidateQueries');
    await act(async () => {
      await result.current.deleteItem(fileItem);
    });
    await waitFor(() =>
      expect(result.current.deleteSuccess).toContain('File deleted successfully'),
    );

    expect(qcSpy.calledOnce).toBe(true);
  });

  it('should return an error message when deletion fails', async () => {
    const fileItem = { id: 1, name: 'file1.txt' };

    const deleteErrorMessage = 'Failed to delete file';
    await deletePublicItemError(props.fileStorageId, fileItem.id, deleteErrorMessage);
    await getFileStorageFiles({ ...props }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    const qcSpy = sinon.spy(result.current.queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.deleteItem(fileItem).catch(() => {});
    });

    await waitFor(() => expect(result.current.deleteError).toBe(deleteErrorMessage));

    expect(qcSpy.notCalled).toBe(true);
  });

  it('should upload a file successfully and invalidate the query', async () => {
    const parent = '/';
    const mockFile = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    const stub = sinon.stub(federalist, 'uploadPublicFile');

    await getFileStorageFiles({ ...props, path: parent }, { times: 3 });

    stub.resolves();

    const { result } = renderHook(() => useFileStorage(props.fileStorageId), {
      wrapper: createWrapper(),
    });

    const qcSpy = sinon.spy(result.current.queryClient, 'invalidateQueries');

    await waitFor(async () => result.current.uploadFile(parent, mockFile));

    expect(qcSpy.calledOnce).toBe(true);
  });

  it('should throw error when upload file fails', async () => {
    const parent = '/';
    const mockFile = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    const stub = sinon.stub(federalist, 'uploadPublicFile');
    stub.rejects();

    await getFileStorageFiles({ ...props, path: parent }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(props.fileStorageId), {
      wrapper: createWrapper(),
    });

    const qcSpy = sinon.spy(result.current.queryClient, 'invalidateQueries');

    await waitFor(async () =>
      result.current.uploadFile(parent, mockFile).catch((e) => e),
    );

    expect(qcSpy.calledOnce).toBe(false);
  });

  it('should create a folder successfully and invalidate the query', async () => {
    const parent = '/';
    const folderName = 'New Folder';

    await createPublicDirectory(props.fileStorageId, parent, folderName);
    await getFileStorageFiles({ ...props, path: parent }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(props.fileStorageId), {
      wrapper: createWrapper(),
    });

    const qcSpy = sinon.spy(result.current.queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.createFolder(parent, folderName);
    });

    await waitFor(() =>
      expect(result.current.createFolderSuccess).toContain('Folder created successfully'),
    );
    expect(qcSpy.calledOnce).toBe(true);
  });

  it('should return an error when folder creation fails', async () => {
    const parent = '/';
    const folderName = 'daddy';
    const errorMessage = `A folder named "${folderName}" already exists in this folder.`;

    await createPublicDirectoryError(
      props.fileStorageId,
      parent,
      folderName,
      errorMessage,
    );
    await getFileStorageFiles({ ...props, path: parent }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(props.fileStorageId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.createFolder(parent, folderName).catch(() => {});
    });

    await waitFor(() => expect(result.current.createFolderError).toBe(errorMessage));
  });

  it('should return a specific error when creating a duplicate folder', async () => {
    const parent = '/';
    const folderName = 'mommy';
    const errorMessage = `A folder named "${folderName}" already exists in this folder.`;

    await createPublicDirectoryError(
      props.fileStorageId,
      parent,
      folderName,
      errorMessage,
    );
    await getFileStorageFiles({ ...props, path: parent }, { times: 3 });

    const { result } = renderHook(() => useFileStorage(props.fileStorageId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.createFolder(parent, folderName).catch(() => {});
    });

    await waitFor(() => expect(result.current.createFolderError).toBe(errorMessage));
  });
});
