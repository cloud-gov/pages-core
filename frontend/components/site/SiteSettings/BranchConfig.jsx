import React, { useState } from 'react';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';
import ExpandableArea from '../../ExpandableArea';
import LoadingIndicator from '../../LoadingIndicator';
import notificationActions from '../../../actions/notificationActions';
import { capitalize } from '../../../util';

function formatConfig(config) {
  if (!config) return '';

  return yaml.dump(config);
}

function BranchConfig({
  id, branch, config, context, handleUpdate,
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
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label htmlFor={`${branch}-input`}>Branch name:</label>
                  <input
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
                <label htmlFor={`${branch}-config-input`}>Configuration:</label>
                <p>
                  Add additional configuration in YAML to be added to your
                  _config.yml file when we build your
                  {' '}
                  {context}
                  {' '}
                  branch.
                </p>
                <textarea
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
              <button
                type="button"
                className="usa-button usa-button-secondary"
                onClick={() => resetValues()}
              >
                Reset
              </button>

              <button type="submit" className="usa-button usa-button-primary">
                Save
              </button>
            </>
          )}
        </div>
      </form>
    </ExpandableArea>
  );
}

BranchConfig.propTypes = {
  id: PropTypes.oneOf([PropTypes.number, null]),
  branch: PropTypes.oneOf([PropTypes.string, null]),
  context: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  config: PropTypes.object,
  handleUpdate: PropTypes.func.isRequired,
};

BranchConfig.defaultProps = {
  id: null,
  branch: null,
  config: null,
};

export default BranchConfig;
