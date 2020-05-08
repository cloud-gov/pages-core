import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  addUserEnvironmentVariable,
  deleteUserEnvironmentVariable,
  fetchUserEnvironmentVariables,
} from '../../../actions/userEnvironmentVariableActions';
import { siteUserEnvironmentVariables } from '../../../selectors/userEnvironmentVariable';
import { USER_ENVIRONMENT_VARIABLE } from '../../../propTypes';
import AlertBanner from '../../alertBanner';
import ExpandableArea from '../../ExpandableArea';
import LoadingIndicator from '../../LoadingIndicator';
import EnvironmentVariableForm from './EnvironmentVariableForm';
import EnvironmentVariableTable from './EnvironmentVariableTable';

const infoContent = (
  <Fragment>
    Certain environment variable names are reserved for Federalist use and will
    be ignored. Warnings for any ignored environment variables will be present
    in the build logs. See the default variables in
    {' '}
    <a
      href="https://federalist.18f.gov/documentation/env-vars-on-federalist-builds"
      rel="noopener"
    >
      Environment Variables On Federalist Builds
    </a>
    {' '}
    for an up-to-date list.
  </Fragment>
);

const warningContent = (
  <Fragment>
    Federalist is a
    <b> FISMA Low </b>
    system, do NOT store variables for systems that are Moderate or High, and
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
  </Fragment>
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
            <Fragment>
              <ExpandableArea
                bordered
                title="Add a new environment variable"
                render={toggle => (
                  <div className="well">
                    <EnvironmentVariableForm onSubmit={params => addUEV(params).then(toggle)} />
                  </div>
                )}
              />
              { showTable
                && (
                <EnvironmentVariableTable uevs={data} onDelete={deleteUEV} />
                )
              }
            </Fragment>
          )
        }
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
