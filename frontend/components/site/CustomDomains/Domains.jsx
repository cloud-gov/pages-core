import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../../../util/federalistApi';
import AlertBanner from '../../alertBanner';
import LoadingIndicator from '../../LoadingIndicator';
import { capitalize } from '../../../util';

const initialValues = {
  isLoading: true,
  error: null,
  data: [],
};

const infoContent = (
  <>
    Interested in adding a custom domain to this site? Email
    {' '}
    <a
      title="Email support to launch a custom domain."
      href="mailto:pages-support@cloud.gov"
    >
      pages-support@cloud.gov
    </a>
    {' '}
    so we can start the domain launch process for this site.
    <br />
    <br />
    <strong>NOTE: </strong>
    {' '}
    Use
    {' '}
    <a
      target="_blank"
      rel="noopener noreferrer"
      title="Our documentation on setting up your DNS for your custom domain."
      href="https://cloud.gov/pages/documentation/custom-domains/"
    >
      our documentation
    </a>
    {' '}
    to prepare your DNS settings before the launch.
  </>
);

function ListRow({ children }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '10px',
        width: '100%',
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
};

function ContextTitle({ context }) {
  return (
    <div style={{ display: 'inline-block' }}>
      <h4 style={{ fontWeight: 'bold' }}>
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
      style={{
        backgroundColor: getStateColor(state),
        borderRadius: '100px',
        color: 'white',
        display: 'inline-block',
        fontSize: '12px',
        padding: '5px 10px',
        height: '30px',
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

function Domains({ siteId }) {
  const [domains, setDomains] = useState(initialValues);

  useEffect(() => {
    api
      .fetchSiteDomains(siteId)
      .then(results => setDomains({ ...domains, isLoading: false, data: results }))
      .catch(error => setDomains({
        ...domains,
        isLoading: false,
        state: 'error',
        error: error.message,
      }));
  }, [siteId]);

  return (
    <div>
      {domains.error && (
        <div className="well">
          <h3>
            An error occurred while loading your site branch configurations.
          </h3>
          <p>{domains.error}</p>
        </div>
      )}
      {domains.isLoading && (
        <div className="well">
          <LoadingIndicator />
        </div>
      )}
      {!domains.isLoading && !domains.error && domains.data && (
        <ul>
          {domains.data.map((domain, index) => {
            const sbc = domain.SiteBranchConfig;
            const names = domain.names.split(',');

            return (
              <li style={{ listStyle: 'none' }} key={`domain-${domain.id}`}>
                {index > 0 && (
                  <div
                    style={{
                      backgroundColor: 'rgb(240, 240, 240)',
                      height: '3px',
                      marginBottom: '10px',
                      marginTop: '40px',
                      width: '100%',
                    }}
                  />
                )}
                <ListRow>
                  <ContextTitle context={sbc.context} branch={sbc.branch} />
                  <StateIndicator state={domain.state} />
                </ListRow>
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
              </li>
            );
          })}
        </ul>
      )}
      {!domains.isLoading && !domains.error && domains?.data?.length === 0 && (
        <p>There are no custom domains configured for this site currently.</p>
      )}
      <div style={{ paddingTop: '2em' }}>
        <AlertBanner status="info" message={infoContent} alertRole={false} />
      </div>
    </div>
  );
}

Domains.propTypes = {
  siteId: PropTypes.number.isRequired,
};

export default Domains;
