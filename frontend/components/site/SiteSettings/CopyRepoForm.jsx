import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm, Field } from 'redux-form';
import AlertBanner from '../../alertBanner';
import BranchField from '../../Fields/BranchField';
import InputWithErrorField from '../../Fields/InputWithErrorField';
import { githubUsernameRegex } from '../../../../api/utils/validators';

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
        This feature will allow you to copy this site&apos;s code to a new GitHub repository.
        You must have admin permissions for the code in GitHub to use this feature and you
        must have permissions to create new repos in GitHub if copying into an org.
        <br /><br />
        A new site will be created in Federalist, but only <b>basic</b> site information is
        copied — builds, associated users, and site settings will not be transferred.
        <br />
        If your site is hosted at a custom domain, and you want that domain to point
        to your new site,
        please <a href="mailto:federalist-support@gsa.gov">contact Federalist support</a> after
        the copy has completed to enact the transfer.
        <b>Do not delete</b> the original site in Federalist before the copied code
        is live at your custom domain.
      </p>
    );
  }

  renderOwnerField() {
    return (
      <Field
        component={InputWithErrorField}
        label="What GitHub user or org will own the copied site?"
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
      /**
       * Here we reuse the BranchField since the same regex can be used to
       * validate branch and repository names which are acceptable to GitHub.
       */
      <BranchField
        component={InputWithErrorField}
        className="form-control"
        label="What name do you want for the copied repo?"
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

CopyRepoForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

export { CopyRepoForm };

export default reduxForm({ form: 'copyRepoForm' })(CopyRepoForm);
