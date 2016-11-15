import React from 'react';

import TemplateSiteList from './TemplateSiteList';
import LinkButton from '../linkButton';
import AlertBanner from '../alertBanner';

import siteActions from '../../actions/siteActions';

import templates from '../../../../config/templates';

const propTypes = {
  storeState: React.PropTypes.shape({
    user: React.PropTypes.shape({
      username: React.PropTypes.string,
      id: React.PropTypes.string
    }),
    error: React.PropTypes.string
  })
}

class AddSite extends React.Component {
  constructor(props) {
    super(props);

    const { user } = props.storeState;

    this.state = {
      owner: user.username || '',
      repository: '',
      engine: 'jekyll',
      defaultBranch: 'master',
      users: [+user.id]
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(event) {
    event.preventDefault();
    siteActions.addSite(this.state);
  }

  onSubmitTemplate(siteName, templateName) {
    siteActions.cloneRepo({
      repo: siteName
    }, templates[templateName]);
  }

  onChange(event) {
    const { name, value } = event.target;
    const nextState = {};

    nextState[name] = value;
    this.setState(nextState);
  }

  render() {
    return (
      <div>
        <AlertBanner message={this.props.storeState.error} />
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <h1>Make a new site</h1>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <p>
              There are a few different ways you can add sites to Federalist. You can start with a brand new site by selecting one of our template sites below. Or you can specify the Github repository where your site&#39;s code lives.
            </p>
          </div>
        </div>
        <TemplateSiteList
          templates={templates}
          handleSubmitTemplate={this.onSubmitTemplate} />
        <div className="usa-grid">
          <div className="col-md-12">
            <h2>Or add your own Github repository</h2>
          </div>
        </div>
        <form onSubmit={ this.onSubmit }>
          <div className="usa-grid">
            <div className="col-md-12">
              <div className="form-group">
                <label htmlFor="owner">Repository Owner&#39;s Username or Org name</label>
                <input
                  type="text"
                  id="owner"
                  className="form-control"
                  name="owner"
                  value={this.state.owner}
                  onChange={this.onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="repository">Repository&#39;s Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="repository"
                  id="repository"
                  value={this.state.repository}
                  onChange={this.onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="engine">Static site engine</label>
                <select
                  name="engine"
                  id="engine"
                  className="form-control"
                  value={this.state.engine}
                  onChange={this.onChange}
                >
                  <option value="jekyll">Jekyll</option>
                  <option value="hugo">Hugo</option>
                  <option value="static">Static (just publish the files in the repository)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="defaultBranch">Default branch</label>
                <input
                  type="text"
                  id="defaultBranch"
                  className="form-control"
                  name="defaultBranch"
                  value={this.state.defaultBranch}
                  onChange={this.onChange}/>
              </div>
            </div>
          </div>
          <div className="usa-grid">
            <div className="usa-width-one-whole">
              <LinkButton
                className="usa-button-secondary"
                text="Cancel"
                href="/sites" />
              <button type="submit" className="usa-button usa-button-primary" style={{display: 'inline-block'}}>
                Submit repository-based site
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

AddSite.propTypes = propTypes;

export default AddSite;
