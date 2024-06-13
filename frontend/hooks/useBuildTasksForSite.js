/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  buildTasks: null,
  isLoading: true,
};

export const useBuildTasksForSite = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    api.fetchSiteTasks(id).then(data => setResults({
      isLoading: false,
      buildTasks: data,
    }));
  }, []);

  return results;
};
