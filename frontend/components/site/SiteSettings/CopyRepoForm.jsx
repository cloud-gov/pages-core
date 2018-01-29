import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm, Field } from 'redux-form';
import AlertBanner from '../../alertBanner';
import BranchField from '../../Fields/BranchField';
import InputWithErrorField from '../../Fields/InputWithErrorField';
import { githubUsernameRegex } from '../../../../api/utils/validators';

const propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

class CopyRepoForm extends React.Component {
  validateInput(value) {
    if (value && value.length && !(githubUsernameRegex.test(value))) {
      return 'Field contains invalid characters. Please use only letters or hyphens.';
    }

    return undefined;
  }

  renderDisclaimer() {
    return (
      <p>
        This feature will allow you to copy this site to a new GitHub repository.
        You must be an admin user of this site.
        <br /><br />
        A new site will be created in Federalist, but only <b>basic</b> site information is
        copied — builds, associated users, and site settings will not be transferred.
        <br />
        If your site is hosted at a custom domain, and you want that domain to point
        to your new site,
        please <a href="mailto:federalist-support@gsa.gov">contact Federalist support</a>
        after the copy
        has completed. Do not delete the original site before receiving confirmation that the
        route information has been updated.
      </p>
    );
  }

  renderOwnerField() {
    return (
      <Field
        component={InputWithErrorField}
        label="What GitHub account will own this site?"
        id="target-owner"
        name="targetOwner"
        type="text"
        placeholder="account-name"
        validate={[this.validateInput]}
        required
      />
    );
  }

  renderRepoField() {
    return (
      <BranchField
        component={InputWithErrorField}
        className="form-control"
        label="Name the new site"
        id="new-repo-name"
        name="newRepoName"
        type="text"
        placeholder="my-new-site"
        required
      />
    );
  }

  renderBranchField() {
    return (
      <BranchField
        className="form-control"
        label="From which branch should the new repo be based?"
        id="base-branch"
        name="newBaseBranch"
        type="text"
        placeholder="master"
        required
      />
    );
  }

  renderSubmit() {
    return (
      <input
        type="submit"
        className="usa-button usa-button-primary"
        value="Copy site"
        disabled={this.props.pristine}
      />
    );
  }

  render() {
    return (
      <form onSubmit={this.props.handleSubmit}>
        <AlertBanner
          status="warning"
          header="This is an alpha feature!"
          message=" "
        >
          {this.renderDisclaimer()}
        </AlertBanner>
        <div className="well">
          <fieldset>
            <legend>Site details</legend>
            <div className="form-group">
              {this.renderOwnerField()}
            </div>
            <div className="form-group">
              {this.renderRepoField()}
            </div>
            <div className="form-group">
              {this.renderBranchField()}
            </div>
          </fieldset>
        </div>
        {this.renderSubmit()}
      </form>
    );
  }
}

CopyRepoForm.propTypes = propTypes;

export { CopyRepoForm };

export default reduxForm({ form: 'copyRepoForm' })(CopyRepoForm);
