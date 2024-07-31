/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  data: null,
  isLoading: true,
};

export const useReportData = (id, subPage) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    api.fetchReportData(id, subPage).then(data => setResults({
      isLoading: false,
      data,
    }));
  }, []);

  return results;
};
