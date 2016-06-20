
import React from 'react';

class SiteSettings extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this._onChange.bind(this);
  }

  getSiteUrl(id) {
    return `#/sites/${id}`;
  }

  _onChange(e) {
    let target = e.target;
    let name = target.name;
    let value = target.value;
    this.setState({
      name: value
    });
  }

  onSubmit(e) {
    console.log('e', e);
    e.preventDefault();
    console.log('state', this.state);
  }

  render() {
    let site = this.props.site;
    let defaultBranchClass = (site.defaultBranch) ? 'active': ''

    return (
    <div>
      <div className="usa-grid header">
        <div className="usa-width-two-thirds">
          <img className="header-icon" src="/images/website.svg" alt="Websites icon" />
          <div className="header-title">
            <h1>{ site.repository }</h1>
            <p>Settings</p>
          </div>
        </div>
        <div className="usa-width-one-third">
          <a className="usa-button usa-button-big pull-right icon icon-view icon-white"
              href={ this.props.viewLink } alt="View this website" role="button" target="_blank">
              View Website
          </a>
        </div>
      </div>
      <form id="site-edit">
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label for="defaultBranch" className={ defaultBranchClass }>
              Default branch</label>
            <input name="defaultBranch" className="form-control" onChange={ this.onChange } type="text"
              value={ site.defaultBranch } />
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <label>Draft previews</label>
            <div className="radio">
              <input type="radio" name="publicPreview" id="public" value="true" />
              <label for="public">Allow anyone to see previews of draft sites</label>
            </div>
            <div className="radio">
              <input type="radio" name="publicPreview" id="private" value="" />
              <label for="private">Only users with Federalist accounts can see previews</label>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
              <label className="active" for="domain">Custom domain</label>
              <input name="domain" className="form-control" type="text" placeholder="https://example.com" value={ site.domain } />
            </div>
            <div className="usa-alert usa-alert-info">
              <div className="usa-alert-body">
                <h3 className="usa-alert-heading">Custom Domain</h3>
                <p className="usa-alert-text">Use a custom domain by setting an <code>ALIAS</code> record with your DNS provider that points this origin:</p>
                <input readonly type="text" value="" />
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <div className="form-group">
               <label for="config" className="">Custom configuration</label>
              <textarea name="config" className="form-control">
                { site.config }
              </textarea>
            </div>
            <div className="usa-alert usa-alert-info">
              <div className="usa-alert-body">
                <h3 className="usa-alert-heading">Configuration</h3>
                <p className="usa-alert-text">Add additional configuration in yaml to be added to your <code>_config.yml</code> file when we render your site.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <a href={ this.getSiteUrl(site.id) } className="usa-button usa-button-gray" role="button">Cancel</a>
            <a className="usa-button usa-button-primary" onClick={ this.onSubmit } role="submit">
              Save
            </a>
          </div>
        </div>
      </form>
      <div className="usa-grid">
        <div className="usa-alert usa-alert-error" role="alert">
          Delete this site from Federalist?
          <a href="#" className="usa-button usa-button-secondary" data-action="delete-site" alt="delete the site { site.repository }">Delete</a>
        </div>
      </div>
    </div>
    )
  }
}

SiteSettings.propTypes = {
  site: React.PropTypes.object,
  viewLink: React.PropTypes.string
};

export default SiteSettings;
