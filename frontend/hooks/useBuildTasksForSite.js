/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const REFRESH_INTERVAL = parseInt(30 * 1000, 10);
const initResultsState = {
  buildTasks: null,
  isLoading: true,
};

export const useBuildTasksForSite = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    async function fetchTasks() {
      const data = await api.fetchSiteTasks(id);
      const updatedResults = {
        isLoading: false,
        buildTasks: data,
      };
      setResults(updatedResults);
    }

    // first load
    if (results.isLoading) {
      fetchTasks();
    }

    const refreshTimer = setTimeout(fetchTasks, REFRESH_INTERVAL);

    // clear on unmount
    return () => clearTimeout(refreshTimer);
  }, [results]);

  return results;
};
