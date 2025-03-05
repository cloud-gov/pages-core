import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import federalist from '@util/federalistApi';
import { REFETCH_INTERVAL } from './utils';

const INITIAL_DATA = {
  data: [],
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
};

export default function useFileStorage(
  fileStorageId,
  path = '',
  sortKey = null,
  sortOrder = null,
  page = 1,
) {
  const previousData = useRef();
  const queryClient = useQueryClient();

  const fetchQuery = useQuery({
    queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
    queryFn: () => federalist.fetchPublicFiles(fileStorageId, path, sortKey, sortOrder, page),
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

  const { data, isLoading, isFetching, isPending, isPlaceholderData } = fetchQuery;

  useEffect(() => {
    if (data !== undefined) {
      previousData.current = data;
    }
  }, [data]);

  const deleteMutation = useMutation({
    mutationFn: (item) => federalist.deletePublicItem(fileStorageId, item.id),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      });
    },
    onError: (err) => {
      throw new Error('Failed to delete file ' + (err?.message || ''));
    },
  });

  async function deleteItem(item) {
    return deleteMutation.mutate(item);
  }

  const uploadMutation = useMutation({
    mutationFn: ({ parent = '/', file }) =>
      federalist.uploadPublicFile(fileStorageId, parent, file),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      });
    },
    onError: (err, { file }) => {
      const errorMessage = err?.message || "Upload failed.";
      if (errorMessage.includes("already exists")) {
        throw new Error(`A file named "${file.name}" already exists in this folder.`)
      }
      throw new Error(errorMessage);
    },

  });

  async function uploadFile(parent, file) {
    return uploadMutation.mutateAsync({ parent, file });
  }

  const createFolderMutation = useMutation({
    mutationFn: ({ parent = '/', name }) =>
      federalist.createPublicDirectory(fileStorageId, parent, name),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      }),
    onError: (err, { name }) => {
      const errorMessage = err?.message || "Could not create folder.";
      if (errorMessage.includes("already exists")) {
        throw new Error(`A folder named "${name}" already exists in this folder.`)
      }
      throw new Error(errorMessage);
    },
  });

  async function createFolder(parent, name) {
    return createFolderMutation.mutateAsync({ parent, name });
  }

  return {
    ...data,
    queryClient,
    isLoading,
    isFetching,
    isPending,
    isPlaceholderData,
    defaultError: fetchQuery.isError ? fetchQuery.error : null,
    deleteItem,
    deleteError: deleteMutation.error,
    deleteSuccess: deleteMutation.isSuccess,
    uploadFile,
    uploadError: uploadMutation.error,
    uploadSuccess: uploadMutation.isSuccess,
    createFolder,
    createFolderError: createFolderMutation.error,
    createFolderSuccess: createFolderMutation.isSuccess,
  };
}
