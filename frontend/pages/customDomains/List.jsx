import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { currentSite } from '@selectors/site';
import UsaIcon from '@shared/UsaIcon';
import { useSiteDomains } from '@hooks';
import { capitalize } from '@util';

function ListRow({ children, justify = 'flex-start', ...props }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: justify,
        gap: '10px',
        width: '100%',
        ...props,
      }}
    >
      {children}
    </div>
  );
}

ListRow.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  justify: PropTypes.string,
};

ListRow.defaultProps = {
  justify: 'flex-start',
};

function ContextTitle({ context }) {
  return (
    <div style={{ display: 'inline-block' }}>
      <h4 className="font-sans-lg margin-0">
        {context === 'site' ? 'Live Site' : `${capitalize(context)} Site`}
      </h4>
    </div>
  );
}

ContextTitle.propTypes = {
  context: PropTypes.string.isRequired,
};

const getStateColor = (state) => {
  switch (state) {
    case 'provisioned':
      return 'rgb(12, 175, 0)';
    case 'failed':
      return '#d83731';
    case 'pending':
      return '#112e51';
    default:
      return '#e27600';
  }
};

function StateIndicator({ state }) {
  return (
    <div
      className="usa-tag usa-tag--big radius-pill font-body-2xs text-ls-1"
      style={{
        backgroundColor: getStateColor(state),
      }}
    >
      {state}
    </div>
  );
}

StateIndicator.propTypes = {
  state: PropTypes.string.isRequired,
};

function DomainLink({ domain }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      title={`Link to site's domain ${domain}`}
      href={`https://${domain}`}
    >
      {domain}
    </a>
  );
}

DomainLink.propTypes = {
  domain: PropTypes.string.isRequired,
};

function Domains({ siteId, domains, handleDelete }) {
  const navigate = useNavigate();
  return (
    <div className="well-gray-lightest grid-row">
      {domains.error && (
        <div className="well grid-col-12">
          <h3>
            An error occurred while loading your site branch configurations.
          </h3>
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
                      <span style={{ fontWeight: 'bold' }}>Branch:</span>
                      {sbc.branch}
                    </ListRow>
                    <ListRow>
                      <span style={{ fontWeight: 'bold' }}>
                        {names.length > 1 ? 'Domains' : 'Domain'}
                        :
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
                        onClick={() => navigate(
                          `/sites/${siteId}/custom-domains/${domain.id}/edit`
                        )}
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
                            *Cannot edit or delete a
                            {' '}
                            {domain.state}
                            {' '}
                            domain.
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
      })
    ),
  }).isRequired,
  handleDelete: PropTypes.func.isRequired,
  siteId: PropTypes.number.isRequired,
};

function DomainList() {
  const { id } = useParams();
  const { domains, deleteSiteDomain } = useSiteDomains(id);
  const site = useSelector(state => currentSite(state.sites, id));

  if (!site || domains.isLoading) {
    return null;
  }

  return (
    <div>
      <Domains
        siteId={site.id}
        domains={domains}
        handleDelete={deleteSiteDomain}
      />
      <div
        style={{
          position: 'relative',
          margin: '2em 0',
        }}
      >
        <Link
          to={`/sites/${id}/custom-domains/new`}
          role="button"
          className="usa-button button-add-website margin-right-0"
          alt="Add a new site domain"
        >
          <UsaIcon name="add" />
          {' '}
          Add new domain
        </Link>
      </div>
    </div>
  );
}

export { DomainList };
export default DomainList;
