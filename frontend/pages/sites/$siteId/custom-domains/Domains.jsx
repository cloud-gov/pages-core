import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import ListRow from './ListRow';
import ContextTitle from './ContextTitle';
import StateIndicator from './StateIndicator';
import DomainLink from './DomainLink';

export default function Domains({ siteId, domains, handleDelete }) {
  const navigate = useNavigate();
  return (
    <div className="well-gray-lightest grid-row">
      {domains.error && (
        <div className="well grid-col-12">
          <h3>An error occurred while loading your site branch configurations.</h3>
          <p>{domains.error}</p>
        </div>
      )}
      {!domains.isLoading && !domains.error && domains.data && (
        <ul className="usa-card-group grid-col-12">
          {domains.data.map((domain) => {
            const sbc = domain.SiteBranchConfig;
            const names = domain.names.split(',');
            const actionsDisabled = domain.state !== 'pending';

            return (
              <li className="usa-card grid-col-12" key={`domain-${domain.id}`}>
                <div className="usa-card__container bg-base-lightest">
                  <div className="usa-card__header">
                    <ListRow>
                      <ContextTitle context={sbc.context} branch={sbc.branch} />
                      <StateIndicator state={domain.state} />
                    </ListRow>
                  </div>
                  <div className="usa-card__body">
                    <ListRow>
                      <span
                        style={{
                          fontWeight: 'bold',
                        }}
                      >
                        Branch:
                      </span>
                      {sbc.branch}
                    </ListRow>
                    <ListRow>
                      <span
                        style={{
                          fontWeight: 'bold',
                        }}
                      >
                        {names.length > 1 ? 'Domains' : 'Domain'}:
                      </span>
                      {names.map((name, idx) => (
                        <span key={`domain-name-${name}`}>
                          {domain.state === 'provisioned' ? (
                            <DomainLink domain={name} />
                          ) : (
                            name
                          )}
                          {names.length > idx + 1 && ' '}
                        </span>
                      ))}
                    </ListRow>
                  </div>
                  <div className="usa-card__footer">
                    <ListRow id="domain-edit-delete-actions" justify="flex-end">
                      <button
                        disabled={actionsDisabled}
                        className="usa-button"
                        onClick={() =>
                          navigate(`/sites/${siteId}/custom-domains/${domain.id}/edit`)
                        }
                        alt={`Edit site domain ${domain.names}`}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        disabled={actionsDisabled}
                        className="usa-button usa-button--secondary"
                        onClick={() => handleDelete(domain.id)}
                        alt={`Delete site domain ${domain.names}`}
                        type="button"
                      >
                        Delete
                      </button>
                    </ListRow>
                    {actionsDisabled && (
                      <ListRow justify="flex-end">
                        <p className="margin-bottom-0">
                          <em htmlFor="domain-edit-delete-actions">
                            *Cannot edit or delete a {domain.state} domain.
                          </em>
                        </p>
                      </ListRow>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!domains.isLoading && !domains.error && domains?.data?.length === 0 && (
        <p>There are no custom domains configured for this site currently.</p>
      )}
    </div>
  );
}

Domains.propTypes = {
  domains: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        names: PropTypes.string,
        state: PropTypes.string,
        SiteBranchConfig: PropTypes.shape({
          branch: PropTypes.string,
          context: PropTypes.string,
        }),
      }),
    ),
  }).isRequired,
  handleDelete: PropTypes.func.isRequired,
  siteId: PropTypes.number.isRequired,
};
