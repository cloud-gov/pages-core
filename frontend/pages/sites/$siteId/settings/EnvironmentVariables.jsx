import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  addUserEnvironmentVariable,
  deleteUserEnvironmentVariable,
  fetchUserEnvironmentVariables,
} from '@actions/userEnvironmentVariableActions';
import { siteUserEnvironmentVariables } from '@selectors/userEnvironmentVariable';
import AlertBanner from '@shared/alertBanner';
import ExpandableArea from '@shared/ExpandableArea';
import LoadingIndicator from '@shared/LoadingIndicator';
import globals from '@globals';
import { USER_ENVIRONMENT_VARIABLE } from '@propTypes';

import EnvironmentVariableForm from './EnvironmentVariableForm';
import EnvironmentVariableTable from './EnvironmentVariableTable';

const infoContent = (
  <>
    Certain environment variable names are reserved for
    {` ${globals.APP_NAME} `}
    use and will
    be ignored. Warnings for any ignored environment variables will be present
    in the build logs. See the default variables in
    {' '}
    <a
      href="https://cloud.gov/pages/documentation/env-vars-on-pages-builds"
      rel="noopener"
    >
      Environment Variables On
      {` ${globals.APP_NAME} `}
      Builds
    </a>
    {' '}
    for an up-to-date list.
  </>
);

const warningContent = (
  <>
    {` ${globals.APP_NAME} `}
    is a
    {' '}
    <b>
      FISMA Moderate
    </b>
    {' '}
    system, do NOT store variables for systems that are High, and
    only expose variables if it is safe to do so. You assume the risk if the
    values you add contain, or allow access to information that is not suitable
    for this categorization. See
    {' '}
    <a
      href="https://csrc.nist.gov/Projects/Risk-Management/Risk-Management-Framework-(RMF)-Overview/Security-Categorization"
      rel="noopener noreferrer"
    >
      FISMA Security Categorization
    </a>
    {' '}
    for more information on FISMA information categorization.
  </>
);

class EnvironmentVariables extends Component {
  componentDidMount() {
    const { siteId, actions } = this.props;
    actions.fetchUserEnvironmentVariables(siteId);
  }

  render() {
    const {
      siteId,
      userEnvironmentVariables: { isLoading, data },
      actions,
    } = this.props;

    const addUEV = params => actions.addUserEnvironmentVariable(siteId, params);
    const deleteUEV = uevId => actions.deleteUserEnvironmentVariable(siteId, uevId);
    const showTable = !isLoading && data.length > 0;

    return (
      <div className="grid-col-12">
        <h3 className="font-heading-xl margin-top-4 margin-bottom-2">Environment Variables</h3>
        <div>
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
              <>
                <ExpandableArea
                  bordered
                  title="Add a new environment variable"
                >
                  <div className="well">
                    <EnvironmentVariableForm onSubmit={params => addUEV(params)} />
                  </div>
                </ExpandableArea>
                { showTable
                && (
                <EnvironmentVariableTable uevs={data} onDelete={deleteUEV} />
                )}
              </>
            )}
        </div>
      </div>
    );
  }
}

EnvironmentVariables.propTypes = {
  siteId: PropTypes.number.isRequired,
  actions: PropTypes.shape({
    fetchUserEnvironmentVariables: PropTypes.func.isRequired,
    addUserEnvironmentVariable: PropTypes.func.isRequired,
    deleteUserEnvironmentVariable: PropTypes.func.isRequired,
  }).isRequired,
  userEnvironmentVariables: PropTypes.shape({
    isLoading: PropTypes.bool.isRequired,
    data: PropTypes.arrayOf(USER_ENVIRONMENT_VARIABLE).isRequired,
  }).isRequired,
};

const mapStateToProps = ({ userEnvironmentVariables }, { siteId }) => ({
  userEnvironmentVariables: siteUserEnvironmentVariables(userEnvironmentVariables, siteId),
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    addUserEnvironmentVariable,
    deleteUserEnvironmentVariable,
    fetchUserEnvironmentVariables,
  }, dispatch),
});

export { EnvironmentVariables };
export default connect(mapStateToProps, mapDispatchToProps)(EnvironmentVariables);
