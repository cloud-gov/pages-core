
import React from 'react';
import RadioInput from '../radioInput';
import LinkButton from '../linkButton';
import siteActions from '../../actions/siteActions';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);

    const { site } = props;

    this.state = {
      config: site.config || '',
      defaultBranch: site.defaultBranch || '',
      domain: site.domain || '',
      publicPreview: site.publicPreview
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  getSiteUrl() {
    return `/sites/${this.props.params.id}`;
  }

  onChange(event) {
    const { name, value } = event.target;
    const newState = {};

    newState[name] = value

    this.setState(newState);
  }

  onSubmit(event) {
    siteActions.updateSite(this.props.site, this.state);
    event.preventDefault();
  }

  render() {
    const { state } = this;
    const { id, defaultBranch } = this.props.site;
    const defaultBranchClass = defaultBranch ? 'active': ''

    return (
      <form id="site-edit" onSubmit={this.onSubmit}>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label for="defaultBranch" className={ defaultBranchClass }>
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
              id="public"
              value={true}
              checked={state.publicPreview}
              handleChange={this.onChange}
              labelText="Allow anyone to see previews of draft sites" />
            <RadioInput
              name="publicPreview"
              id="public"
              value={false}
              checked={!state.publicPreview}
              handleChange={this.onChange}
              labelText="Only users with Federalist accounts can see previews" />
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <label className="active" for="domain">Custom domain</label>
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
                <p className="usa-alert-text">Use a custom domain by setting an <code>ALIAS</code> record with your DNS provider that points this origin:</p>
                <input readOnly type="text" value="" />
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
               <label for="config" className="">Custom configuration</label>
              <textarea
                name="config"
                className="form-control"
                value={state.config} />
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
            <button type="submit" className="usa-button usa-button-primary">
              Save
            </button>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-alert usa-alert-error" role="alert">
            Delete this site from Federalist?
            <button className="usa-button usa-button-secondary" alt="delete the site { site.repository }">Delete</button>
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
