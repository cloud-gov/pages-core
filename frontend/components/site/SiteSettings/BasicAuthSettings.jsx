import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import BasicAuthSettingsForm from './BasicAuthSettingsForm';
import LoadingIndicator from '../../LoadingIndicator';
import AlertBanner from '../../alertBanner';
import {
  saveBasicAuth,
  removeBasicAuth,
  fetchBasicAuth,
} from '../../../actions/basicAuthActions';
import { BASIC_AUTH } from '../../../propTypes';

const infoContent = (
  <Fragment>
    If you would like to add basic authentication to your site previews, please provide a
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

export class BasicAuthSettings extends Component {
  componentDidMount() {
    const { siteId, actions } = this.props;
    actions.fetchBasicAuth(siteId);
  }

  render() {
    const {
      siteId,
      basicAuth: { isLoading, data: credentials },
      actions,
    } = this.props;

    const setBasicAuth = params => actions.saveBasicAuth(siteId, params);
    const disableBasicAuth = () => actions.removeBasicAuth(siteId);

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
            credentials.username
              ? ( 
                <p className="well-text">
                  <b>Username:</b>
                  {credentials.username}
                  <br />
                  <b>Password:</b>
                  {credentials.password}
                  <br />
                  <br />
                  <button type="button" className="margin-0" id="disable-basic-auth-btn" onClick={() => disableBasicAuth()}>
                    Disable
                  </button>
                </p>
              )
              : ( <BasicAuthSettingsForm initialValues={credentials} onSubmit={setBasicAuth} /> )
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

const mapStateToProps = ({ basicAuth }) => ({
  basicAuth,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    saveBasicAuth,
    removeBasicAuth,
    fetchBasicAuth,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(BasicAuthSettings);
