import { waitFor, renderHook } from '@testing-library/react';
import * as router from 'react-router-dom';
import nock from 'nock';

import { createTestQueryClient } from '@support/queryClient';
import { getFileStorageFile, deletePublicItem } from '@support/nocks/fileStorage';
import useFileStorageFile from './useFileStorageFile';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const createWrapper = createTestQueryClient();

const props = {
  fileStorageServiceId: 123,
  fileId: 123,
};

describe('useFileStorage', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    jest.clearAllMocks();
    nock.restore();
  });

  it('should fetch public file successfully', async () => {
    const data = {
      id: props.fileId,
      fileStorageServiceId: props.fileStorageServiceId,
      name: 'test',
    };
    await getFileStorageFile({ ...props }, data);
    jest.spyOn(router, 'useNavigate').mockReturnValue(jest.fn());

    const { result } = renderHook(() => useFileStorageFile(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(!result.current.isPending).toBe(true));

    expect(result.current.data).toEqual(data);
  });

  it('should handle public file fetch error', async () => {
    const error = {
      message: 'An error occurred',
    };
    await getFileStorageFile({ ...props, statusCode: 401 }, error);
    jest.spyOn(router, 'useNavigate').mockReturnValue(jest.fn());

    const { result } = renderHook(() => useFileStorageFile(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(!result.current.isPending).toBe(true));

    expect(result.current.error.message).toEqual(error.message);
  });

  it('should delete a public file successfully', async () => {
    const redirectTo = '/foo/bar/baz';
    const data = {
      id: props.fileId,
      fileStorageServiceId: props.fileStorageServiceId,
      name: 'test',
    };
    await getFileStorageFile({ ...props }, data);
    await deletePublicItem(props.fileStorageServiceId, props.fileId);

    const mockedNavigate = jest.fn();
    jest.spyOn(router, 'useNavigate').mockReturnValue(mockedNavigate);

    const { result } = renderHook(() => useFileStorageFile(...Object.values(props)), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(!result.current.isPending).toBe(true));
    await waitFor(() => result.current.deleteItem(redirectTo));

    expect(mockedNavigate).toHaveBeenCalledWith(redirectTo);
  });
});
