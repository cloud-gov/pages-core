import { renderHook, waitFor } from '@testing-library/react';
import { useMultiFileUpload } from './useMultiFileUpload';

describe('useMultiFileUpload Hook', () => {
  // Mock file creation utility
  const createMockFile = (name = 'test.txt', size = 1000, type = 'text/plain') =>
    new File([new ArrayBuffer(size)], name, { type });

  // Mock upload function
  const mockOnUpload = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addFiles', () => {
    it('should add files to the queue', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          urlPath: '/upload',
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [createMockFile('file1.txt'), createMockFile('file2.txt')];

      await waitFor(() => result.current.addFiles(mockFiles));

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].status).toBe('queued');
    });
  });

  describe('clearFiles', () => {
    it('should clear all added files in the queue', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          urlPath: '/upload',
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [createMockFile('file1.txt'), createMockFile('file2.txt')];

      await waitFor(() => result.current.addFiles(mockFiles));

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].status).toBe('queued');

      await waitFor(() => result.current.clearFiles());

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('removeFile', () => {
    it('should remove a specific file from the queue', async () => {
      const { result } = renderHook(() =>
        useMultiFileUpload({
          urlPath: '/upload',
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [createMockFile('file1.txt'), createMockFile('file2.txt')];

      await waitFor(() => {
        result.current.addFiles(mockFiles);
      });

      const fileIdToRemove = result.current.files[0].id;

      await waitFor(() => {
        result.current.removeFile(fileIdToRemove);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].data.name).toBe('file2.txt');
    });
  });

  describe('startUploads', () => {
    it('should start uploading queued files', async () => {
      const mockOnUpload = jest.fn(() => Promise.resolve());
      const { result } = renderHook(() =>
        useMultiFileUpload({
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [
        createMockFile('file1.txt'),
        createMockFile('file2.txt'),
        createMockFile('file3.txt'),
      ];

      await waitFor(() => result.current.addFiles(mockFiles));
      await waitFor(() => result.current.startUploads());
      await waitFor(() => {
        const successful = result.current.files.filter((f) => f.status === 'success');

        if (successful.length > 0) {
          expect(successful).toHaveLength(mockFiles.lengt);
        }
      });

      expect(mockOnUpload).toHaveBeenCalledTimes(mockFiles.length);
      expect(result.current.isUploading).toBeFalsy();
      expect(result.current.files).toHaveLength(mockFiles.length);
    });

    it('should handle error uploads', async () => {
      const errorMessage = new Error('Roro');
      const mockOnUpload = jest.fn(() => Promise.reject(errorMessage));
      const { result } = renderHook(() =>
        useMultiFileUpload({
          urlPath: '/upload',
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [createMockFile('file1.txt')];

      await waitFor(() => result.current.addFiles(mockFiles));
      await waitFor(() => result.current.startUploads());
      await waitFor(() =>
        expect(result.current.files.filter((f) => f.status === 'error')).toHaveLength(
          mockFiles.length,
        ),
      );

      const errored = result.current.files.filter((f) => f.status === 'error');

      expect(mockOnUpload).toHaveBeenCalledTimes(mockFiles.length);
      expect(result.current.files).toHaveLength(mockFiles.length);
      errored.map((file) => file.message === errorMessage);
    });

    it('should handle error with default error message', async () => {
      const mockOnUpload = jest.fn(() => Promise.reject());
      const { result } = renderHook(() =>
        useMultiFileUpload({
          urlPath: '/upload',
          onUpload: mockOnUpload,
        }),
      );

      const mockFiles = [createMockFile('file1.txt')];

      await waitFor(() => result.current.addFiles(mockFiles));
      await waitFor(() => result.current.startUploads());
      await waitFor(() =>
        expect(result.current.files.filter((f) => f.status === 'error')).toHaveLength(
          mockFiles.length,
        ),
      );

      const errored = result.current.files.filter((f) => f.status === 'error');

      expect(mockOnUpload).toHaveBeenCalledTimes(mockFiles.length);
      expect(result.current.files).toHaveLength(mockFiles.length);
      errored.map((file) => file.message === `Unable to upload ${file.data.name}`);
    });
  });
});
