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
      api.fetchTasks(id).then((data) =>
        setResults({
          isLoading: false,
          buildTasks: data,
          hasBuildTasks: data.length > 0,
        }),
      );
    }
  }, [results]);

  return results;
};
