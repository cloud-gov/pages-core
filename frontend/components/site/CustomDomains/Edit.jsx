import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSiteDomain } from '../../../hooks';
import AlertBanner from '../../alertBanner';

const infoContent = (
  <>
    The domain
    {' '}
    <strong>CANNOT</strong>
    {' '}
    be edited since it has already been
    provisioned. Please reach out to the Pages support team at
    {' '}
    <a
      title="Email support to launch a custom domain."
      href="mailto:pages-support@cloud.gov"
    >
      pages-support@cloud.gov
    </a>
    {' '}
    to you edit this domain.
  </>
);

function EditCustomDomain() {
  const { id, domainId } = useParams();
  const {
    availableConfigs, domain, setDomainValues, updateSiteDomain,
  } = useSiteDomain(id, domainId);

  if (domain.data.state !== 'pending') {
    return (
      <>
        <h2>Edit Custom Domain</h2>
        <div>
          <AlertBanner
            status="warning"
            message={infoContent}
            alertRole={false}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Edit Custom Domain</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();

          return updateSiteDomain();
        }}
      >
        <div className="well">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor="domain-name">Domain Name</label>
            <p>
              Enter the custom domain name you will be launching.
              {' '}
              <span style={{ fontWeight: 'bold' }}>DO NOT</span>
              {' '}
              prepend
              {' '}
              <span style={{ fontWeight: 'bold' }}>https://</span>
              {' '}
              or
              {' '}
              <span style={{ fontWeight: 'bold' }}>http://</span>
              {' '}
              to the domain
              name.
            </p>
            <p>
              Enter only the domain name like:
              {' '}
              <span style={{ fontWeight: 'bold' }}>www.agency.gov</span>
              ,
              {' '}
              <span style={{ fontWeight: 'bold' }}>site.agency.gov</span>
              , or
              {' '}
              <span style={{ fontWeight: 'bold' }}>demo.site.agency.gov</span>
              .
            </p>
            <input
              id="domain-name"
              name="domain-name"
              value={domain.data.names}
              placeholder='ie. "site.agency.gov"'
              onChange={event => setDomainValues({
                names: event.target.value,
              })}
              required
            />
          </div>
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor="branch-context">Branch Context</label>
            <p>
              Select the site&apos;s branch context you will associate to the custom
              domain.
            </p>
            <p>
              If you do not see the branch, please set the branch in the site
              settings&apos; branch configurations for
              {' '}
              <Link
                to={`/sites/${id}/settings/#site-branch-config`}
                alt="Go to site settings' live site context branch configuration"
              >
                Live
              </Link>
              {' '}
              or
              {' '}
              <Link
                to={`/sites/${id}/settings/#demo-branch-config`}
                alt="Go to site settings' demo context branch configuration"
              >
                Demo
              </Link>
              .
            </p>
            <select
              id="branch-context"
              name="branch-context"
              value={domain.data.siteBranchConfigId}
              onChange={(event) => {
                setDomainValues({
                  siteBranchConfigId: parseInt(event.target.value, 10),
                });
              }}
              required
            >
              <option value=""> -- select an option -- </option>
              {availableConfigs.map(sbc => (
                <option key={sbc.id} value={sbc.id}>
                  Branch
                  {' '}
                  {sbc.branch}
                  {' '}
                  | Context
                  {' '}
                  {sbc.context}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="usa-button usa-button-primary">
            Update
          </button>
        </div>
      </form>
    </>
  );
}

export default EditCustomDomain;
