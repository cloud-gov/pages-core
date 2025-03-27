import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import federalist from '@util/federalistApi';

export default function useFileStorageFile(fileStorageServiceId, fileStorageFileId) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isPending, isPlaceholderData, isError, error } =
    useQuery({
      queryKey: ['fileStorageFile', fileStorageServiceId, fileStorageFileId],
      queryFn: () => federalist.fetchPublicFile(fileStorageServiceId, fileStorageFileId),
    });

  const deleteMutation = useMutation({
    mutationFn: async (redirectTo) => {
      await federalist.deletePublicItem(fileStorageServiceId, fileStorageFileId);
      return navigate(redirectTo);
    },
  });

  return {
    data,
    error,
    deleteError: deleteMutation.error,
    deleteIsPending: deleteMutation.isPending,
    isError,
    isFetching,
    isLoading,
    isPending,
    isPlaceholderData,
    queryClient,
    deleteItem: (redirectTo) => deleteMutation.mutateAsync(redirectTo),
  };
}
