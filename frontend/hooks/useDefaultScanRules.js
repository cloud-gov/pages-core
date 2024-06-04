/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  defaultScanRules: [],
  isLoading: true,
};

export const useDefaultScanRules = () => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    api.getDefaultBuildScanRules().then(data => setResults({
      isLoading: false,
      defaultScanRules: data,
    }));
  }, []);

  return results;
};
