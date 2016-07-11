
import React from 'react';

import siteActions from '../actions/siteActions';

class AddSite extends React.Component {
  constructor(props) {
    super(props);
  }

  getDashboardUrl() {
    return `#/sites`;
  }

  onClickAddSite(e) {
    e.preventDefault();
    let site = {};
    // siteActions.addSite(site);
  }

  render() {
    return (
    <div>
      <div className="usa-grid">
        <div className="usa-width-one-whole">
          <h1>Make a new site</h1>
        </div>
      </div>
      <div className="usa-grid">
        <div className="usa-width-one-whole">
          <p>There are a few different ways you can add sites to Federalist. You can start with a brand new site by selecting one of our template sites below. Or you the Github repository where your site's code lives.</p>
        </div>
      </div>
      <div className="usa-grid">
        <div className="col-md-12">
          <h2>Or add your own Github repository</h2>
        </div>
      </div>
      <form>
        <div className="usa-grid">
          <div className="col-md-12">
            <div className="form-group">
              <label for="owner">Repository owner's Github username</label>
              <input type="text" id="owner" className="form-control" name="owner" value={ this.props.currentUserGithubUsername } />
            </div>
            <div className="form-group">
              <label for="repository">Name of repository</label>
              <input type="text" className="form-control" name="repository" id="repository"></input>
            </div>
            <div className="form-group">
              <label for="engine">Static site engine</label>
              <select name="engine" id="engine" className="form-control">
                <option selected value="jekyll">Jekyll</option>
                <option value="hugo">Hugo</option>
                <option value="static">Static (just publish the files in the repository)</option>
              </select>
            </div>
            <div className="form-group">
              <label for="defaultBranch">Default branch</label>
              <input type="text" id="defaultBranch" className="form-control" name="defaultBranch" value="master" />
            </div>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <input type="hidden" name="users" value={ this.props.currentUserId } />
            <a href={ this.getDashboardUrl() } className="usa-button usa-button-secondary" role="button">Cancel</a>
            <a type="submit" className="usa-button usa-button-primary" onClick={ this.onClickAddSite }>
              Submit repository-based site
            </a>
          </div>
        </div>
      </form>
    </div>
  );
  }
}

AddSite.propTypes = {
  currentUserGithubUsername: React.PropTypes.string,
  currentUserId: React.PropTypes.number
}

export default AddSite;
