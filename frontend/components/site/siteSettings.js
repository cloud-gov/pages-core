
import React from 'react';
import SitePreviewLinksTable from "./sitePreviewLinksTable";
import RadioInput from '../radioInput';
import LinkButton from '../linkButton';
import siteActions from '../../actions/siteActions';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);

    const { site } = props;

    this.state = {
      enableSave: false,
      config: site.config || '',
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      publicPreview: site.publicPreview
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  getSiteUrl() {
    return `/sites/${this.props.params.id}`;
  }

  onChange(event) {
    const { name, value } = event.target;
    const newState = {
      enableSave: true
    };

    newState[name] = value;

    this.setState(newState);
  }

  onSubmit(event) {
    siteActions.updateSite(this.props.site, this.state);
    event.preventDefault();
    this.setState({ enableSave: false })
  }

  onDelete(event) {
    if (confirm('Are you sure you want to delete this site? This action will also delete your site builds, including all previews.')) {
      siteActions.deleteSite(this.props.params.id);
    }

    event.preventDefault();
  }

  render() {
    const { state } = this;
    const { id, defaultBranch } = this.props.site;
    const defaultBranchClass = defaultBranch ? 'active': '';

    return (
      <form id="site-edit" onSubmit={this.onSubmit}>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label htmlFor="defaultBranch" className={ defaultBranchClass }>
              Default branch</label>
            <input
              name="defaultBranch"
              className="form-control"
              onChange={ this.onChange }
              type="text"
              value={ state.defaultBranch } />
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label>Draft previews</label>
            <RadioInput
              name="publicPreview"
              value={true}
              checked={state.publicPreview}
              handleChange={this.onChange}
              labelText="Allow anyone to see previews of draft sites" />
            <RadioInput
              name="publicPreview"
              value={false}
              checked={!state.publicPreview}
              handleChange={this.onChange}
              labelText="Only users with Federalist accounts can see previews" />
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <SitePreviewLinksTable site={this.props.site}/>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <label className="active" htmlFor="domain">Custom domain</label>
              <input
                name="domain"
                className="form-control"
                type="text"
                placeholder="https://example.com"
                value={ state.domain }
                onChange={this.onChange} />
            </div>
            <div className="usa-alert usa-alert-info">
              <div className="usa-alert-body">
                <h3 className="usa-alert-heading">Custom Domain</h3>
                <p className="usa-alert-text">This read-only origin box is used for Federalist to set a custom domain on the 18F side. Federalist customers only need this information if handling custom URL work directly.</p>
                <input readOnly type="text" value="" />
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
               <label htmlFor="config" className="">Custom configuration</label>
              <textarea
                name="config"
                className="form-control"
                value={state.config}
                onChange={this.onChange} />
            </div>
            <div className="usa-alert usa-alert-info">
              <div className="usa-alert-body">
                <h3 className="usa-alert-heading">Configuration</h3>
                <p className="usa-alert-text">
                  Add additional configuration in yaml to be added to your <code>_config.yml</code> file when we render your site.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <LinkButton
              href={this.getSiteUrl()}
              className="usa-button-gray"
              text="Cancel" />
            <button
              type="submit"
              className="usa-button usa-button-primary"
              disabled={ !this.state.enableSave }
              style={{display: 'inline'}}
            >
              Save
            </button>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-alert usa-alert-error" role="alert">
            Delete this site from Federalist?
            <button
              className="usa-button usa-button-secondary"
              alt="delete the site { site.repository }"
              onClick={this.onDelete}
            >Delete</button>
          </div>
        </div>
      </form>
    );
  }
}

SiteSettings.propTypes = {
  site: React.PropTypes.object,
  viewLink: React.PropTypes.string
};

export default SiteSettings;
