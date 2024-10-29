import { useState } from 'react';
import api from '../util/federalistApi';
import alertActions from '../actions/alertActions';

const initialState = () => ({
  isScanActionDisabled: false,
});

export const useScannableBuild = (build) => {
  const [state, setState] = useState(initialState());

  async function startScan(buildId) {
    setState((currentState) => ({
      ...currentState,
      isScanActionDisabled: true,
    }));

    try {
      await api.runScansForBuild(buildId);
      alertActions.alertSuccess(`Report generation queued for build # ${buildId}`);
      return window.location.replace(`/sites/${build.site.id}/reports?build=${build.id}`);
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isScanActionDisabled: false,
      }));
      return alertActions.alertError(
        `An error occured when attempting to start report: ${error.message}`,
      );
    }
  }

  return {
    ...state,
    startScan,
  };
};
