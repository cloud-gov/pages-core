/* global window:true */

/* TODO: remove the below line and properly set PropType validation */
/* eslint react/forbid-prop-types:0 react/require-default-props:0 */

import React from 'react';
import PropTypes from 'prop-types';

import SiteGithubBranchesTable from './siteGithubBranchesTable';
import LinkButton from '../linkButton';
import githubBranchActions from '../../actions/githubBranchActions';
import siteActions from '../../actions/siteActions';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);

    const { site } = props;

    this.state = {
      enableSave: false,
      demoBranch: site.demoBranch || '',
      demoDomain: site.demoDomain || '',
      config: site.config || '',
      previewConfig: site.previewConfig || '',
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      engine: site.engine,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    githubBranchActions.fetchBranches(this.props.site);
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
            <label htmlFor="defaultBranch" className={defaultBranchClass}>
              Default branch</label>
            <input
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
            <label htmlFor="engine">Static site engine</label>
            <select
              name="engine"
              className="form-control"
              value={state.engine}
              onChange={this.onChange}
            >
              <option value="jekyll">Jekyll</option>
              <option value="static">Static (just publish the files in the repository)</option>
            </select>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <h4 className="label">GitHub Branches</h4>
            <SiteGithubBranchesTable site={this.props.site} branches={this.props.githubBranches} />
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <div className="well">
                <h3 className="well-heading">Custom Domain</h3>
                <p className="well-text">
                  If you build your site with Jekyll, Federalist can configure your
                  production site to load at a custom domain specified here.
                </p>
                <input
                  name="domain"
                  className="form-control"
                  type="text"
                  placeholder="https://example.com"
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
                  Setup a branch to be deployed to a demo url.
                </p>
                <p>Branch name:</p>
                <input
                  name="demoBranch"
                  className="form-control"
                  type="text"
                  placeholder="Branch name"
                  value={state.demoBranch}
                  onChange={this.onChange}
                />
                <p>Demo domain:</p>
                <input
                  name="demoDomain"
                  className="form-control"
                  type="text"
                  placeholder="https://preview.example.com"
                  value={state.demoDomain}
                  onChange={this.onChange}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="well">
              <h3 className="well-heading">Site configuration</h3>
              <p className="well-text">
                Add additional configuration in yaml to be added to your
                <code>_config.yml</code> file when we build your site&apos;s default branch.
              </p>
              <textarea
                name="config"
                className="form-control"
                value={state.config}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="well">
              <h3 className="well-heading">Preview configuration</h3>
              <p className="well-text">
                Add additional configuration in yaml to be added to your
                <code>_config.yml</code> file when we build a preview branch for your site.
              </p>
              <textarea
                name="previewConfig"
                className="form-control"
                value={state.previewConfig}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <LinkButton
              href={this.getSiteUrl()}
              className="usa-button-gray"
              text="Cancel"
            />
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
        <div className="usa-grid">
          <div className="usa-alert usa-alert-delete" role="alert">
            Delete this site from Federalist?
            <button
              className="usa-button usa-button-secondary"
              onClick={this.onDelete}
            >Delete</button>
          </div>
        </div>
      </form>
    );
  }
}

SiteSettings.propTypes = {
  site: PropTypes.object,
  params: PropTypes.object,
  githubBranches: PropTypes.object,
};

export default SiteSettings;
