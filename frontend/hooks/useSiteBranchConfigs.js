import { useEffect, useState } from 'react';
import api from '../util/federalistApi';

const initialValues = {
  isLoading: true,
  error: null,
  data: [],
};

export const useSiteBranchConfigs = (siteId, { noPreviews = false } = {}) => {
  const [siteBranchConfigs, setConfigs] = useState(initialValues);

  useEffect(() => {
    api
      .fetchSiteBranchConfigs(siteId)
      .then((results) => {
        if (noPreviews) {
          const filtered = results.filter(r => r.context !== 'preview');
          setConfigs({ ...siteBranchConfigs, isLoading: false, data: filtered });
        } else {
          setConfigs({ ...siteBranchConfigs, isLoading: false, data: results });
        }
      })
      .catch(error => setConfigs({ ...siteBranchConfigs, state: 'error', error: error.message }));
  }, [siteId]);

  return { siteBranchConfigs };
};
