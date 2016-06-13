import bel from 'bel';

import siteActions from '../actions/siteActions';

function onSubmitClick(e) {
  e.preventDefault();
  let values = {};
  // TODO: Serialize form data into values

  siteActions.addSite(values);
}

function html(user) {
  return bel`<div>
    <div class="usa-grid">
      <div class="usa-width-one-whole">
        <h1>Make a new site</h1>
      </div>
    </div>
    <div class="usa-grid">
      <div class="usa-width-one-whole">
        <p>There are a few different ways you can add sites to Federalist. You can start with a brand new site by selecting one of our template sites below. Or you the Github repository where your site's code lives.</p>
      </div>
    </div>
    <div class="usa-grid">
      <div class="col-md-12">
        <h2>Or add your own Github repository</h2>
      </div>
    </div>
    <form>
      <div class="usa-grid">
        <div class="col-md-12">
          <div class="form-group">
            <label for="owner">Repository owner's Github username</label>
            <input type="text" id="owner" class="form-control" name="owner" value="<%- user.username %>">
          </div>
          <div class="form-group">
            <label for="repository">Name of repository</label>
            <input type="text" class="form-control" name="repository" id="repository"></input>
          </div>
          <div class="form-group">
            <label for="engine">Static site engine</label>
            <select name="engine" id="engine" class="form-control">
              <option selected value="jekyll">Jekyll</option>
              <option value="hugo">Hugo</option>
              <option value="static">Static (just publish the files in the repository)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="defaultBranch">Default branch</label>
            <input type="text" id="defaultBranch" class="form-control" name="defaultBranch" value="master">
          </div>
        </div>
      </div>
      <div class="usa-grid">
        <div class="usa-width-one-whole">
          <input type="hidden" name="users" value="${user.id}">
          <a href="#/dashboard" class="usa-button usa-button-secondary" role="button">Cancel</a>
          <a onclick=${onSubmitClick} type="submit" class="usa-button usa-button-primary">Submit repository-based site</a>
        </div>
      </div>
    </form>
  </div>`;
}

export default function render (state) {
  return html(state.user);
}
