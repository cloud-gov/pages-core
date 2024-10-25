import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  data: null,
  isLoading: true,
};

export const useReportData = (id, subPage) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    async function fetchData() {
      setResults(() => initResultsState);
      const data = await api.fetchReportData(id, subPage);
      setResults(() => ({
        isLoading: false,
        data,
      }));
    }

    fetchData();
  }, [id, subPage]);

  return results;
};
