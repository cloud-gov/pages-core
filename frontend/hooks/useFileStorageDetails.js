import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import federalist from '@util/federalistApi';
import { REFETCH_INTERVAL } from './utils';

const TIMEOUT_DURATION = 5000;

const PLACEHOLDER_DATA = {
  id: 0,
  name: "-",
  key: "-",
  type: "-",
  description: "-",
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  lastModifiedAt: new Date(),
  lastModifiedBy: ''
}

export default function useFileStorageDetails(
  fileStorageId,
  fileId
) {
  const previousData = useRef();
  const queryClient = useQueryClient();
  // const [deleteError, setDeleteError] = useState(null);
  // const [deleteSuccess, setDeleteSuccess] = useState(null);
  // const deleteTimeout = useRef(null);

  // const handleSuccess = (setSuccess, setError, timeoutRef, message) => {
  //   setError(null);
  //   setSuccess(() => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current);
  //     timeoutRef.current = setTimeout(() => setSuccess(null), TIMEOUT_DURATION);
  //     return message;
  //   });
  //   queryClient.invalidateQueries({
  //     queryKey: ['fileStorageDetails', fileStorageId, fileId],
  //   });
  // };

  // const handleError = (setError, setSuccess, timeoutRef, errorMessage) => {
  //   setSuccess(null);
  //   setError(() => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current);
  //     timeoutRef.current = setTimeout(() => setError(null), TIMEOUT_DURATION);
  //     return errorMessage;
  //   });
  // };

  const { data, isLoading, isFetching, isPending, isPlaceholderData, isError, error } =
    useQuery({
      queryKey: ['fileStorageDetails', fileStorageId, fileId],
      queryFn: () =>
        federalist.fetchPublicFile(fileStorageId, fileId),
      refetchInterval: REFETCH_INTERVAL,
      refetchIntervalInBackground: false,
      enabled: !!fileStorageId,
      keepPreviousData: true,
      staleTime: 2000,
      placeholderData: previousData.current || PLACEHOLDER_DATA,
      onError: (err) => {
        // using an empty string so that we don't end up with "undefined" at the end
        throw new Error('Failed to fetch public file ' + (err?.message || ''));
      },
    });
  useEffect(() => {
    if (data !== undefined) {
      previousData.current = data;
    }
  }, [data]);

  // useEffect(() => {
  //   return () => {
  //     if (deleteTimeout.current) clearTimeout(deleteTimeout.current);
  //   };
  // }, []);

  // const deleteMutation = useMutation({
  //   mutationFn: ({ item }) => federalist.deletePublicItem(fileStorageId, item.id),
  //   onSuccess: () =>
  //     handleSuccess(
  //       setDeleteSuccess,
  //       setDeleteError,
  //       deleteTimeout,
  //       'File deleted successfully.',
  //     ),
  //   onError: (err) =>
  //     handleError(
  //       setDeleteError,
  //       setDeleteSuccess,
  //       deleteTimeout,
  //       err?.message || 'Failed to delete file.',
  //     ),
  // });

  return {
    data,
    queryClient,
    isLoading,
    isFetching,
    isPending,
    isPlaceholderData,
    isError,
    error,
    // deleteItem: (item) => deleteMutation.mutateAsync({ item }),
    // deleteError,
    // deleteSuccess,
  };
}
