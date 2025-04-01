import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

import api from '../util/federalistApi';

const INITIAL_DATA = {
  data: [],
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
};

export default function useFileStorageLogs(fileStorageServiceId, page = 1) {
  const previousData = useRef();

  const { data, error, isPending, isPlaceholderData } = useQuery({
    queryKey: ['fileHistory', fileStorageServiceId, page],
    queryFn: async () => {
      const response = await api.fetchAllPublicFilesHistory(fileStorageServiceId, page);
      return response || INITIAL_DATA;
    },
    enabled: !!fileStorageServiceId,
    // use previous data for smoother navigating between pages, prevents jumps
    keepPreviousData: true,
    staleTime: 60000, // 1 minte between refetches
    placeholderData: previousData.current || INITIAL_DATA,
  });

  useEffect(() => {
    if (data !== undefined) {
      previousData.current = data;
    }
  }, [data]);

  return {
    ...data,
    isPending,
    isPlaceholderData,
    error,
  };
}
