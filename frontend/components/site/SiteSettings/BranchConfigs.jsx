import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../../../util/federalistApi';
import BranchConfig from './BranchConfig';
import LoadingIndicator from '../../LoadingIndicator';

const initialValues = {
  isLoading: true,
  error: null,
  data: [],
};

// Temporary contexts array to mirror the former context values in the site table
// A future UI will allow users to set configurations for any branch
const defaultContexts = ['site', 'demo', 'preview'];

function handleUpdate(siteId) {
  return ({
    id, branch, config, context,
  }) => {
    if (!id) {
      return api.createSiteBranchConfig(siteId, branch, config, context);
    }

    return api.updateSiteBranchConfig(siteId, id, branch, config, context);
  };
}

function BranchConfigs({ siteId }) {
  const [configs, setConfigs] = useState(initialValues);

  useEffect(() => {
    api
      .fetchSiteBranchConfigs(siteId)
      .then(results => setConfigs({ ...configs, isLoading: false, data: results }))
      .catch(error => setConfigs({ ...configs, state: 'error', error: error.message }));
  }, [siteId]);

  return (
    <div>
      <h3>Branch Configurations</h3>
      {configs.error && (
        <div className="well">
          <h4>
            An error occurred while loading your site branch configurations.
          </h4>
          <p>{configs.error}</p>
        </div>
      )}
      {configs.isLoading && (
        <div className="well">
          <LoadingIndicator />
        </div>
      )}
      {!configs.isLoading
        && !configs.error
        && defaultContexts.map((context) => {
          const branchConfig = configs.data.find(
            conf => conf.context === context
          );

          if (branchConfig) {
            return (
              <BranchConfig
                key={`config-context-${context}`}
                {...branchConfig}
                handleUpdate={handleUpdate(siteId)}
              />
            );
          }
          return (
            <BranchConfig
              key={`config-context-${context}`}
              context={context}
              handleUpdate={handleUpdate(siteId)}
            />
          );
        })}
    </div>
  );
}

BranchConfigs.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default BranchConfigs;
