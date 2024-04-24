/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  buildTasks: null,
  isLoading: true,
};

export const useBuildTasks = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    if (!results.buildTasks) {
      api.fetchTasks(id).then(data => setResults({
        isLoading: false,
        buildTasks: data,
        hasBuildTasks: process.env.FEATURE_BUILD_TASKS === 'active' && data.length > 0,
      }));
    }
  }, [results]);

  return results;
};
