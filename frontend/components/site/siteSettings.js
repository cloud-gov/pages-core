/* global window:true */
import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import { SITE } from '../../propTypes';
import HttpsUrlInput from '../httpsUrlInput';
import siteActions from '../../actions/siteActions';

const propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  site: SITE,
  // TODO: Delete from route - githubBranches: GITHUB_BRANCHES,
};

const defaultProps = {
  site: null, // TODO: Should site be required actually? when would it be null?
};


export class SiteSettings extends React.Component {
  constructor(props) {
    super(props);

    const { site } = props;

    this.state = {
      enableSave: false,
      demoBranch: site.demoBranch || '',
      demoDomain: site.demoDomain || '',
      config: site.config || '',
      previewConfig: site.previewConfig || '',
      demoConfig: site.demoConfig || '',
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      engine: site.engine,
    };

    autoBind(this, 'onChange', 'onSubmit', 'onDelete', 'getSiteUrl');
  }

  onChange(event) {
    const { name, value } = event.target;
    const newState = {
      enableSave: true,
    };

    newState[name] = value;

    this.setState(newState);
  }

  onSubmit(event) {
    siteActions.updateSite(this.props.site, this.state);
    event.preventDefault();
    this.setState({ enableSave: false });
  }

  onDelete(event) {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this site? This action will also delete your site builds, including all previews.')) {
      siteActions.deleteSite(this.props.params.id);
    }

    event.preventDefault();
  }

  getSiteUrl() {
    return `/sites/${this.props.params.id}`;
  }

  render() {
    const { state } = this;
    const { defaultBranch } = this.props.site;
    const defaultBranchClass = defaultBranch ? 'active' : '';

    return (
      <form id="site-edit" onSubmit={this.onSubmit}>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label htmlFor="defaultBranchInput" className={defaultBranchClass}>
              Default branch
            </label>
            <input
              id="defaultBranchInput"
              name="defaultBranch"
              className="form-control"
              onChange={this.onChange}
              type="text"
              value={state.defaultBranch}
            />
          </div>
        </div>

        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <div className="well">
                <h3 className="well-heading">Custom Domain</h3>
                <p className="well-text">
                  After you delegate your .gov or .mil URL to Federalist,
                  enter the URL here so your site builds correctly.
                  See <a href="https://federalist-docs.18f.gov/pages/how-federalist-works/custom-urls/" target="_blank" rel="noopener noreferrer">
                  Federalist&apos;s custom URL documentation</a> for more information.
                </p>
                <HttpsUrlInput
                  name="domain"
                  className="form-control"
                  value={state.domain}
                  onChange={this.onChange}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <div className="well">
                <h3 className="well-heading">Demo Site</h3>
                <p className="well-text">
                  Setup a branch to be deployed to a demo URL.
                </p>
                <label htmlFor="demoBranchInput">Branch name:</label>
                <input
                  name="demoBranch"
                  id="demoBranchInput"
                  className="form-control"
                  type="text"
                  placeholder="Branch name"
                  value={state.demoBranch}
                  onChange={this.onChange}
                />
                <label htmlFor="demoDomainInput">Demo domain:</label>
                <HttpsUrlInput
                  name="demoDomain"
                  className="form-control"
                  id="demoDomainInput"
                  value={state.demoDomain}
                  onChange={this.onChange}
                  placeholder="https://preview.example.com"
                />
              </div>
            </div>
          </div>
        </div>


        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <a href={this.getSiteUrl()} className="usa-button usa-button-gray">
              Cancel
            </a>
            <button
              type="submit"
              className="usa-button usa-button-primary"
              disabled={!this.state.enableSave}
              style={{ display: 'inline' }}
            >
              Save
            </button>
          </div>
        </div>

      </form>
    );
  }
}

SiteSettings.propTypes = propTypes;
SiteSettings.defaultProps = defaultProps;

export default SiteSettings;
