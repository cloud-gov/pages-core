/* eslint-disable import/prefer-default-export */
import { useState } from 'react';
import api from '../util/federalistApi';
import alertActions from '../actions/alertActions';

function checkIsPreviewBuild(build, previewBuilds) {
  return previewBuilds[build.branch] === build.id;
}

function checkBuildHasBuildTasks(build) {
  return build.BuildTasks?.length > 0;
}

function checkAllBuildTasksFinished(build) {
  return build.BuildTasks?.every(
    ({ status }) => status === 'success' || status === 'error' || status === 'cancelled'
  );
}

function checkIsScannableBuild(build, showBuildTasks, previewBuilds) {
  return (
    showBuildTasks
    && checkIsPreviewBuild(build, previewBuilds)
    && checkAllBuildTasksFinished(build)
  );
}

const initialState = ({ build, previewBuilds, showBuildTasks }) => {
  const isPreviewBuild = checkIsPreviewBuild(build, previewBuilds);
  const allBuildTasksFinished = checkAllBuildTasksFinished(build);
  const isScannableBuild = checkIsScannableBuild(build, showBuildTasks, previewBuilds);
  const buildHasBuildTasks = checkBuildHasBuildTasks(build);

  return {
    build,
    allBuildTasksFinished,
    buildHasBuildTasks,
    previewBuilds,
    isPreviewBuild,
    isScanActionDisabled: false,
    isScannableBuild,
  };
};

export const useScannableBuild = (build, previewBuilds, showBuildTasks) => {
  const [state, setState] = useState(
    initialState({ build, previewBuilds, showBuildTasks })
  );

  async function startScan(buildId) {
    setState(currentState => ({
      ...currentState,
      isScanActionDisabled: true,
    }));

    try {
      await api.runScansForBuild(buildId);
      alertActions.alertSuccess(`Scans queued for build # ${buildId}`);
      return window.location.replace(`/sites/${state.build.site.id}/scans?build=${build.id}`);
    } catch (error) {
      setState(currentState => ({
        ...currentState,
        isScanActionDisabled: false,
      }));
      return alertActions.alertError(
        `An error occured when attempting to start scan: ${error.message}`
      );
    }
  }

  return { ...state, startScan };
};
