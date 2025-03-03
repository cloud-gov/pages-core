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

  const { data, isLoading, isFetching, isPending, isPlaceholderData, error } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (item) => federalist.deletePublicItem(fileStorageId, item.id),
    onSuccess: () => {
      // Invalidate the query to refetch the file list after deletion.
      return queryClient.invalidateQueries({
        queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      });
    },
    onError: (err) => {
      // using an empty string so that we don't end up with "undefined" at the end
      throw new Error('Failed to delete file ' + (err?.message || ''));
    },
  });

  async function deleteItem(item) {
    return deleteMutation.mutate(item);
  }

  return {
    ...data,
    queryClient,
    isLoading,
    isFetching,
    isPending,
    isPlaceholderData,
    error,
    deleteItem,
    deleteError: deleteMutation.error,
    deleteSuccess: deleteMutation.isSuccess,
  };
}
