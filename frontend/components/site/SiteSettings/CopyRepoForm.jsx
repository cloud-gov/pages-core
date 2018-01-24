import React from 'react';
import PropTypes from 'prop-types';
import { reduxForm, Field } from 'redux-form';
import AlertBanner from '../../alertBanner';
import BranchField from '../../Fields/BranchField';
import InputWithErrorField from '../../Fields/InputWithErrorField';

const propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
};

class CopyRepoForm extends React.Component {
  validateInput(value) {
    if (value && value.length && !(/^[^-][a-zA-Z-]+$/.test(value))) {
      return 'Field contains invalid characters. Please use only letters or hyphens.';
    }

    return undefined;
  }

  renderDisclaimer() {
    return (
      <p>
        This functionality will allow you to copy a repository you are an admin user of to
        the account of another Federalist user.
        <br /><br />
        It will only copy <b>basic</b> site information — builds, associated users, and
        site settings will not be transferred.

        If your site is hosted at a custom domain, please contact Federalist support after
        copying the repository, and before updating or deleting the existing site from
        Federalist!
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
        placeholder="a-username"
        validate={[this.validateInput]}
        required
      />
    );
  }

  renderRepoField() {
    return (
      <Field
        component={InputWithErrorField}
        className="form-control"
        label="Name the new site"
        id="new-repo-name"
        name="newRepoName"
        type="text"
        placeholder="my-new-site"
        validate={[this.validateInput]}
        required
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
              <BranchField
                className="form-control"
                label="From which branch should the new repo be based?"
                id="base-branch"
                name="newBaseBranch"
                type="text"
                placeholder="master"
                required
              />
            </div>
          </fieldset>
        </div>
        <input
          type="submit"
          className="usa-button usa-button-primary"
          value="Copy site"
          disabled={this.props.pristine}
        />
      </form>
    );
  }
}

CopyRepoForm.propTypes = propTypes;

export { CopyRepoForm };

export default reduxForm({ form: 'copyRepoForm' })(CopyRepoForm);
