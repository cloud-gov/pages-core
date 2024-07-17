/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initResultsState = {
  siteBuildTasks: [],
  isLoading: true,
};

export const useSiteBuildTasks = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    api.getSiteBuildTasks(id).then((data) => {
      data.sort((a, b) => b.id - a.id);
      setResults({
        isLoading: false,
        siteBuildTasks: data,
      });
    });
  }, [id]);

  return results;
};
