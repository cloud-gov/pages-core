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
    <p>
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
    </p>
    <p>
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
    </p>
  </>
);

function ContextTitle({ context }) {
  return (
    <span style={{ fontWeight: 'bold' }}>
      {context === 'site' ? 'Live site: ' : `${capitalize(context)} site: `}
    </span>
  );
}

ContextTitle.propTypes = {
  context: PropTypes.string.isRequired,
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
          <h4>
            An error occurred while loading your site branch configurations.
          </h4>
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
          {domains.data.map((domain) => {
            const names = domain.names.split(',');
            return (
              <li key={`domain-${domain.id}`}>
                <ContextTitle context={domain.context} />
                {names.map((name, index) => (
                  <>
                    <DomainLink key={`domain-name-${name}`} domain={name} />
                    {names.length > index + 1 && ' '}
                  </>
                ))}
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
