import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import BasicAuthUserField from '../../Fields/BasicAuthUserField';
import BasicAuthPasswordField from '../../Fields/BasicAuthPasswordField';
import { siteBasicAuth } from '../../../selectors/basicAuth';
import { validBasicAuthUsername, validBasicAuthPassword } from '../../../util/validators';
import InputWithErrorField from '../../Fields/InputWithErrorField';
import LoadingIndicator from '../../LoadingIndicator';
import {
  saveBasicAuth,
  removeBasicAuth,
  fetchBasicAuth,
} from '../../../actions/basicAuthActions';
import { BASIC_AUTH } from '../../../propTypes';

const infoContent = (
  <Fragment>
    If you would like to add basic authenticaiton to your site previews, please provide a
    username and password for which you will be prompted to enter when previewing your site.
    For more information see
    {' '}
    <a
      href="https://federalist.18f.gov/documentation/basic-auth"
      rel="noopener"
    >
      Basic Authentication on Federalist Preview Builds
    </a>
    {' '}
    for an up-to-date list.
  </Fragment>
);

const warningContent = (
  <Fragment>
    Federalist is a
    <b> FISMA Low </b>
    system, do NOT reuse credentials from other secure systems. See
    {' '}
    <a
      href="https://csrc.nist.gov/Projects/Risk-Management/Risk-Management-Framework-(RMF)-Overview/Security-Categorization"
      rel="noopener noreferrer"
    >
    FISMA Security Categorization
    </a>
    {' '}
    for more information on FISMA information categorization.
  </Fragment>
);


class BasicAuthSettings extends Component {
  componentDidMount() {
    const { siteId, actions } = this.props;
    actions.fetchBasicAuth(siteId);
  }

  render() {
    const {
      siteId,
      basicAuth: { isLoading, data },
      actions,
    } = this.props;

    const addBasicAuth = params => actions.addBasicAuth(siteId, params);
    const removeBasicAuth = uevId => actions.removeBasicAuth(siteId);
    const showTable = !isLoading && data.length > 0;

    return (
      <div className="well">
        <AlertBanner
          status="info"
          message={infoContent}
          alertRole={false}
        />
        <AlertBanner
          status="warning"
          message={warningContent}
          alertRole={false}
        />
        <br />
        { isLoading
          ? <LoadingIndicator />
          : (
              <form className="settings-form" onSubmit={saveBasicAuth}>
                <h3>Basic Authentication Settings</h3>
                <div className="well">
                  <fieldset>
                    <p className="well-text">
                      Set the username and password to enable basica authentication username and password credentials required to preview your site builds.
                    </p>
                    <legend className="sr-only">Add new environment variable</legend>
                    <Field
                      name="name"
                      type="text"
                      label="Name:"
                      component={InputWithErrorField}
                      required
                      validate={[validateBasicAuthUsername]}
                    />
                    <Field
                      name="value"
                      type="text"
                      label="Value:"
                      component={InputWithErrorField}
                      required
                      minlength={4}
                      validate={[validateBasicAuthPassword]}
                    />
                  </fieldset>
                  <button type="submit" disabled={invalid || submitting}>
                    Save
                  </button>
                  <button type="button" disabled={pristine || submitting} onClick={this.removeBasicAuth}>
                    Remove
                  </button>
                </div>
              </form>
          )
        }
      </div>
    );
  }
}

BasicAuthSettings.propTypes = {
  siteId: PropTypes.number.isRequired,
  actions: PropTypes.shape({
    saveBasicAuth: PropTypes.func.isRequired,
    removeBasicAuth: PropTypes.func.isRequired,
    fetchBasicAuth: PropTypes.func.isRequired,
  }).isRequired,
  basicAuth: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: BASIC_AUTH,
  }).isRequired,
};

const mapStateToProps = ({ basicAuth }, { siteId }) => ({
  basicAuth: siteBasicAuth(basicAuth, siteId),
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    saveBasicAuth,
    removeBasicAuth,
    fetchBasicAuth,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(BasicAuthSettings);
