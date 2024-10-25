import React, { useState } from 'react';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';
import ExpandableArea from '@shared/ExpandableArea';
import LoadingIndicator from '@shared/LoadingIndicator';
import notificationActions from '@actions/notificationActions';
import { capitalize } from '@util';

function formatConfig(config) {
  if (!config) return '';

  return yaml.dump(config);
}

function BranchConfig({
  id,
  branch,
  config,
  context,
  handleUpdate,
  isExpanded,
}) {
  const formattedConfig = formatConfig(config);
  const [isLoading, setIsLoading] = useState(false);
  const [branchConfig, setBranchConfig] = useState({
    id,
    branch,
    config: formattedConfig,
    context,
  });

  const resetValues = () => {
    setBranchConfig({ ...branchConfig, branch, config: formattedConfig });
  };

  return (
    <ExpandableArea
      bordered
      title={`${context === 'site' ? 'Live' : capitalize(context)} site`}
      isExpanded={isExpanded}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();

          setIsLoading(true);

          return handleUpdate(branchConfig)
            .then(() => {
              setIsLoading(false);
              return notificationActions.success(
                `Updated branch config for ${branchConfig.context}`
              );
            })
            .finally(() => setIsLoading(false));
        }}
      >
        <div className="well">
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <>
              {context !== 'preview' && (
                <div className="margin-bottom-3">
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="usa-label text-bold margin-top-0" htmlFor={`${branch}-input`}>Branch name:</label>
                  <input
                    className="usa-input"
                    id={`${branch}-input`}
                    value={branchConfig.branch}
                    onChange={(event) => {
                      setBranchConfig({
                        ...branchConfig,
                        branch: event.target.value,
                      });
                    }}
                  />
                </div>
              )}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="usa-label text-bold margin-top-0" htmlFor={`${branch}-config-input`}>Configuration:</label>
                <p className="margin-top-0">
                  Add additional configuration in YAML to be added to your
                  _config.yml file when we build your
                  {' '}
                  {context}
                  {' '}
                  branch.
                </p>
                <textarea
                  className="usa-input height-15"
                  id={`${branch}-config-input`}
                  name={`${branch}-config-input`}
                  value={branchConfig.config}
                  onChange={(event) => {
                    setBranchConfig({
                      ...branchConfig,
                      config: event.target.value,
                    });
                  }}
                />
              </div>
              <div className="usa-button-group margin-y-2 margin-x-0">
                <button
                  type="button"
                  className="usa-button usa-button--outline"
                  onClick={() => resetValues()}
                >
                  Reset
                </button>

                <button type="submit" className="usa-button usa-button--primary">
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </ExpandableArea>
  );
}

BranchConfig.propTypes = {
  id: PropTypes.number,
  branch: PropTypes.string,
  context: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  config: PropTypes.object,
  handleUpdate: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
};

BranchConfig.defaultProps = {
  id: null,
  branch: null,
  config: null,
  isExpanded: false,
};

export default BranchConfig;
