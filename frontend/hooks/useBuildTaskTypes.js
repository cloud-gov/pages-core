import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  buildTaskTypes: [],
  isLoading: true,
};

export const useBuildTaskTypes = () => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    api.getBuildTaskTypes().then(data => setResults({
      isLoading: false,
      buildTaskTypes: data,
    }));
  }, []);

  return results;
};
