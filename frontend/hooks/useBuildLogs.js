/* eslint-disable import/prefer-default-export */
import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const REFRESH_INTERVAL = parseInt(10 * 1000, 10);
const initResultsState = {
  offset: 0,
  logs: [],
  state: '',
};

export const useBuildLogs = (id) => {
  const [results, setResults] = useState(initResultsState);

  useEffect(() => {
    async function fetchData(fetchOffest) {
      const {
        state,
        output_count: outputCountStr,
        output,
      } = await api.fetchBuildLogs({ id }, fetchOffest);
      const outputCount = parseInt(outputCountStr, 10);
      const updatedLogs = [...results.logs, ...output];
      const updatedResults = {
        offset: fetchOffest + outputCount,
        logs: updatedLogs,
        state,
      };

      if (state === 'created') {
        if (fetchOffest === 0) {
          setResults(updatedResults);
        } else {
          setTimeout(setResults, REFRESH_INTERVAL, updatedResults);
        }
      }

      if (outputCount > 0 && ['success', 'error'].includes(state)) {
        setResults(updatedResults);
      }
    }

    fetchData(results.offset);
  }, [results]);

  return results;
};
