/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  buildDetails: null,
  isLoading: true,
};

export const useBuildDetails = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    if (!results.buildDetails) {
      api.fetchBuild(id).then(data => setResults({
        isLoading: false,
        buildDetails: data,
      }));
    }
  }, [results]);

  return results;
};
