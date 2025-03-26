import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import federalist from '@util/federalistApi';
import { REFETCH_INTERVAL } from './utils';

const INITIAL_DATA = {
  data: [],
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
};

const TIMEOUT_DURATION = 5000;

export default function useFileStorage(
  fileStorageId,
  path = '/',
  sortKey = 'updatedAt',
  sortOrder = 'desc',
  page = 1,
) {
  const previousData = useRef();
  const queryClient = useQueryClient();

  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [createFolderError, setCreateFolderError] = useState(null);
  const [createFolderSuccess, setCreateFolderSuccess] = useState(null);
  const deleteTimeout = useRef(null);
  const createFolderTimeout = useRef(null);

  const handleSuccess = (setSuccess, setError, timeoutRef, message) => {
    setError(null);
    setSuccess(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(null), TIMEOUT_DURATION);
      return message;
    });
    queryClient.invalidateQueries({
      queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
    });
  };

  const handleError = (setError, setSuccess, timeoutRef, errorMessage) => {
    setSuccess(null);
    setError(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setError(null), TIMEOUT_DURATION);
      return errorMessage;
    });
  };

  const { data, isLoading, isFetching, isPending, isPlaceholderData, isError, error } =
    useQuery({
      queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      queryFn: () =>
        federalist.fetchPublicFiles(fileStorageId, path, sortKey, sortOrder, page),
      refetchInterval: REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
      enabled: !!fileStorageId,
      keepPreviousData: true,
      staleTime: 2000,
      placeholderData: previousData.current || INITIAL_DATA,
      onError: (err) => {
        // using an empty string so that we don't end up with "undefined" at the end
        throw new Error('Failed to fetch public files ' + (err?.message || ''));
      },
    });
  useEffect(() => {
    if (data !== undefined) {
      previousData.current = data;
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (deleteTimeout.current) clearTimeout(deleteTimeout.current);
      if (createFolderTimeout.current) clearTimeout(createFolderTimeout.current);
    };
  }, []);

  const deleteMutation = useMutation({
    mutationFn: ({ item }) => federalist.deletePublicItem(fileStorageId, item.id),
    onSuccess: () =>
      handleSuccess(
        setDeleteSuccess,
        setDeleteError,
        deleteTimeout,
        'File deleted successfully.',
      ),
    onError: (err) =>
      handleError(
        setDeleteError,
        setDeleteSuccess,
        deleteTimeout,
        err?.message || 'Failed to delete file.',
      ),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ parent = '/', file }) =>
      federalist.uploadPublicFile(fileStorageId, parent, file),
    onSuccess: (file) => {
      queryClient.invalidateQueries({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      });

      return file;
    },
    onError: (error) => error,
    retry: false,
  });

  const createFolderMutation = useMutation({
    mutationFn: ({ parent = '/', name }) =>
      federalist.createPublicDirectory(fileStorageId, parent, name),
    onSuccess: () =>
      handleSuccess(
        setCreateFolderSuccess,
        setCreateFolderError,
        createFolderTimeout,
        'Folder created successfully.',
      ),
    onError: (err, { name }) => {
      const errorMessage = err?.message || 'Could not create folder.';
      const formattedMessage = errorMessage.includes('already exists')
        ? `A folder named "${name}" already exists in this folder.`
        : errorMessage;
      handleError(
        setCreateFolderError,
        setCreateFolderSuccess,
        createFolderTimeout,
        formattedMessage,
      );
    },
  });

  return {
    ...data,
    queryClient,
    isLoading,
    isFetching,
    isPending,
    isPlaceholderData,
    isError,
    defaultError: error,
    deleteItem: (item) => deleteMutation.mutateAsync({ item }),
    deleteError,
    deleteSuccess,
    uploadFile: (parent, file) => uploadMutation.mutateAsync({ parent, file }),
    createFolder: (parent, name) => createFolderMutation.mutateAsync({ parent, name }),
    createFolderError,
    createFolderSuccess,
  };
}
