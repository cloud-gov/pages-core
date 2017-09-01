import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import TemplateSiteList from './TemplateSiteList';
import AlertBanner from '../alertBanner';
import SelectSiteEngine from '../selectSiteEngine';

import siteActions from '../../actions/siteActions';

const propTypes = {
  storeState: PropTypes.shape({
    user: PropTypes.shape({
      username: PropTypes.string,
      id: PropTypes.number,
    }),
    error: PropTypes.string,
  }),
};

const defaultProps = {
  storeState: null,
};

class AddSite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      owner: this.defaultOwner(),
      repository: '',
      engine: 'jekyll',
      defaultBranch: 'master',
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onSubmit(event) {
    event.preventDefault();
    siteActions.addSite(this.state);
  }

  onSubmitTemplate(site) {
    siteActions.addSite(site);
  }

  onChange(event) {
    const { name, value } = event.target;
    const nextState = {};

    nextState[name] = value;
    this.setState(nextState);
  }

  defaultOwner() {
    const userState = this.props.storeState.user;
    if (userState.data) {
      return userState.data.username;
    }
    return '';
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
              There are a few different ways you can add sites to Federalist.
              You can start with a brand new site by selecting one of our template sites below.
              Or you can specify the Github repository where your site&#39;s code lives.
            </p>
          </div>
        </div>
        <TemplateSiteList
          handleSubmitTemplate={this.onSubmitTemplate}
          defaultOwner={this.defaultOwner()}
        />
        <div className="usa-grid">
          <div className="col-md-12">
            <h2>Or add your own Github repository</h2>
          </div>
        </div>
        <form onSubmit={this.onSubmit}>
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
                  onChange={this.onChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="repository">Repository&#39;s Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="repository"
                  id="repository"
                  value={this.state.repository}
                  onChange={this.onChange}
                />
              </div>
              <div className="form-group">
                <SelectSiteEngine value={this.state.engine} onChange={this.onChange} />
              </div>
              <div className="form-group">
                <label htmlFor="defaultBranch">Default branch</label>
                <input
                  type="text"
                  id="defaultBranch"
                  className="form-control"
                  name="defaultBranch"
                  value={this.state.defaultBranch}
                  onChange={this.onChange}
                />
              </div>
            </div>
          </div>
          <div className="usa-grid">
            <div className="usa-width-one-whole">
              <Link
                role="button"
                to="/sites"
                className="usa-button usa-button-secondary"
              >
                Cancel
              </Link>
              <button type="submit" className="usa-button usa-button-primary" style={{ display: 'inline-block' }}>
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
AddSite.defaultProps = defaultProps;

export default AddSite;
