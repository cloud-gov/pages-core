import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import federalist from '@util/federalistApi';
import { REFETCH_INTERVAL } from './utils';

export default function useFileStorage(
  fileStorageId,
  path = '',
  sortKey = null,
  sortOrder = null,
  page = 1,
) {
  const previousData = useRef();
  const queryClient = useQueryClient();

  const fetchPublicFiles = async () => {
    const response = await federalist.fetchPublicFiles(
      fileStorageId,
      path,
      sortKey,
      sortOrder,
      page,
    );
    if (!response || response.error) {
      // using an empty string so that we don't end up with "undefined" at the end
      throw new Error('Failed to fetch public files ' + (response?.message || ''));
    }
    // because we need things that aren't just on data
    return {
      data: response.data,
      currentPage: response.currentPage,
      totalPages: response.totalPages,
      totalItems: response.totalItems,
    };
  };

  const { data, isLoading, isFetching, isPending, isPlaceholderData, error, refetch } =
    useQuery({
      queryKey: ['fileStorage', fileStorageId, path, sortKey, sortOrder, page],
      queryFn: fetchPublicFiles,
      refetchInterval: REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
      enabled: !!fileStorageId,
      keepPreviousData: true,
      staleTime: 2000,
      placeholderData: previousData.current || [],
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

  const result = data || {};

  const deleteMutation = useMutation({
    mutationFn: async (item) => {
      return await federalist.deletePublicItem(fileStorageId, item.id);
    },
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
    queryClient,
    data: result.data,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
    isLoading,
    isFetching,
    isPending,
    isPlaceholderData,
    fetchError: error,
    refetch,
    deleteItem,
    deleteError: deleteMutation.error,
    deleteSuccess: deleteMutation.isSuccess,
  };
}
