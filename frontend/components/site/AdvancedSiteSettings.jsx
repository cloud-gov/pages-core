import React from 'react';
import PropTypes from 'prop-types';

import SelectSiteEngine from '../selectSiteEngine';

// For now, will put on SiteSettings page
// since I'm unclear if it should be on a totally separate
// view or not

// Engine select
// Custom config
// Demo config
// Preview config
// Delete from my account
//  -> new functionality: disassociate from me
// Delete from Federalist
//  -> existing delete functionality

// TODO: Is SiteGitHubBranchesTable still going to be used
// or should it be deleted?

// TODO: collapse-expand component to wrap this?

const AdvancedSiteSettings = () => (
  <div>
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <SelectSiteEngine value={state.engine} onChange={this.onChange} />
      </div>
    </div>

    {/* CUSTOM CONFIG */}
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

    {/* DEMO CONFIG */}
    <div className="usa-grid">
      <div className="usa-width-one-whole">
        <div className="well">
          <h3 className="well-heading">Demo configuration</h3>
          <p className="well-text">
            Add additional configuration in yaml to be added to your
            <code>_config.yml</code> file when we build your site&apos;s demo branch.
          </p>
          <textarea
            name="demoConfig"
            className="form-control"
            value={state.demoConfig}
            onChange={this.onChange}
          />
        </div>
      </div>
    </div>

    {/* PREVIEW CONFIG */}
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
      <div className="usa-alert usa-alert-delete" role="alert">
        Delete this site from Federalist?
        <button
          className="usa-button usa-button-secondary"
          onClick={this.onDelete}
        >Delete</button>
      </div>
    </div>
  </div>
);

export default AdvancedSiteSettings;
