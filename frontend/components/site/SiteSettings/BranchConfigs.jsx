import React from 'react';
import PropTypes from 'prop-types';
import api from '../../../util/federalistApi';
import { useSiteBranchConfigs } from '../../../hooks';
import BranchConfig from './BranchConfig';
import LoadingIndicator from '../../LoadingIndicator';

// Temporary contexts array to mirror the former context values in the site table
// A future UI will allow users to set configurations for any branch
const defaultContexts = ['site', 'demo', 'preview'];

function getHashContext(hash) {
  if (!hash) return null;

  return hash.slice(1, hash.length).split('-')[0];
}

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

function BranchConfigs({ siteId, hash }) {
  const { siteBranchConfigs: configs } = useSiteBranchConfigs(siteId);
  const hashContext = getHashContext(hash);

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

          const isExpanded = context === hashContext;

          if (branchConfig) {
            return (
              <BranchConfig
                key={`config-context-${context}`}
                {...branchConfig}
                handleUpdate={handleUpdate(siteId)}
                isExpanded={isExpanded}
              />
            );
          }
          return (
            <BranchConfig
              key={`config-context-${context}`}
              context={context}
              handleUpdate={handleUpdate(siteId)}
              isExpanded={isExpanded}
            />
          );
        })}
    </div>
  );
}

BranchConfigs.propTypes = {
  siteId: PropTypes.number.isRequired,
  hash: PropTypes.string,
};

BranchConfigs.defaultProps = {
  hash: null,
};

export default BranchConfigs;
