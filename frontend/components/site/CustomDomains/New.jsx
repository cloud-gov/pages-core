import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSiteDomain } from '../../../hooks';
import AlertBanner from '../../alertBanner';

const infoContent = (
  <>
    Creating a new custom domain will
    {' '}
    <strong>NOT</strong>
    {' '}
    launch the live
    domain URL you enter, but it will prepare this site to launch the domain you
    entered. When you are ready to go live, email
    {' '}
    <a
      title="Email support to launch a custom domain."
      href="mailto:pages-support@cloud.gov"
    >
      pages-support@cloud.gov
    </a>
    {' '}
    so we can start the domain launch process.
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
    to prepare your DNS settings so the domain can be launched.
  </>
);

function NewCustomDomain() {
  const { id } = useParams();
  const {
    availableConfigs, domain, setDomainValues, createSiteDomain,
  } = useSiteDomain(id);
  const { names, siteBranchConfigId } = domain.data;

  return (
    <>
      <h2 className="font-sans-2xl">Create New Custom Domain</h2>
      <div>
        <AlertBanner status="info" message={infoContent} alertRole={false} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();

          return createSiteDomain({ names, siteBranchConfigId });
        }}
      >
        <div className="well">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="usa-label font-sans-lg text-bold" htmlFor="domain-name">Domain Name</label>
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
              className="usa-input"
              name="domain-name"
              value={domain.names}
              placeholder='ie. "site.agency.gov"'
              onChange={(event) => {
                setDomainValues({
                  siteBranchConfigId,
                  names: event.target.value,
                });
              }}
              required
            />
          </div>
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="usa-label font-sans-lg text-bold" htmlFor="branch-context">Branch Context</label>
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
              className="usa-select"
              value={domain.data.siteBranchConfigId}
              onChange={(event) => {
                setDomainValues({
                  names,
                  siteBranchConfigId: event.target.value,
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
          <br />
          <button type="submit" className="usa-button usa-button--primary">
            Save
          </button>
        </div>
      </form>
    </>
  );
}

export default NewCustomDomain;
