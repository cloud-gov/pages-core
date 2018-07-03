import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';

import { USER, ALERT } from '../../propTypes';
import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';
import AlertBanner from '../alertBanner';
import { availableEngines } from '../SelectSiteEngine';
import siteActions from '../../actions/siteActions';
import addNewSiteFieldsActions from '../../actions/addNewSiteFieldsActions';

function getOwnerAndRepo(repoUrl) {
  const owner = repoUrl.split('/')[3];
  const repository = repoUrl.split('/')[4];

  return { owner, repository };
}

export class AddSite extends React.Component {
  constructor(props) {
    super(props);

    autoBind(
      this,
      'onAddUserSubmit',
      'onCreateSiteSubmit',
      'onSubmitTemplate'
    );
  }

  componentWillUnmount() {
    // dispatch the action to hide the additional new site fields
    // when this component is unmounted
    addNewSiteFieldsActions.hideAddNewSiteFields();
  }

  onAddUserSubmit({ repoUrl }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addUserToSite({ owner, repository });
  }

  onCreateSiteSubmit({ repoUrl, engine, defaultBranch }) {
    const { owner, repository } = getOwnerAndRepo(repoUrl);
    siteActions.addSite({ owner, repository, engine, defaultBranch });
  }

  onSubmitTemplate(site) {
    siteActions.addSite(site);
  }

  defaultOwner() {
    const { user } = this.props;

    return (user.data && user.data.username) || '';
  }

  render() {
    // select the function to use on form submit based on
    // the showAddNewSiteFields flag
    const formSubmitFunc = this.props.showAddNewSiteFields ?
      this.onCreateSiteSubmit : this.onAddUserSubmit;
    const { alert } = this.props;

    return (
      <div>
        <div className="usa-grid">
          <div className="page-header usa-grid-full">
            <AlertBanner {...alert} />
            <div className="header-title">
              <h1>
                Make a new site
              </h1>
            </div>
          </div>
          <div className="usa-content">
            <p>
              There are a two different ways you can add sites to Federalist.
              You can specify the GitHub repository where your site&#39;s code lives.
              Or, you can start with a brand new site by selecting one of our template sites below.
            </p>
          </div>
          <h2>Use your own GitHub repository</h2>
          <AddRepoSiteForm
            initialValues={{ engine: availableEngines[0].value, defaultBranch: 'master' }}
            showAddNewSiteFields={this.props.showAddNewSiteFields}
            onSubmit={formSubmitFunc}
          />
          <TemplateSiteList
            handleSubmitTemplate={this.onSubmitTemplate}
            defaultOwner={this.defaultOwner()}
          />
        </div>
      </div>
    );
  }
}

AddSite.propTypes = {
  alert: ALERT,
  showAddNewSiteFields: PropTypes.bool,
  user: USER,
};

AddSite.defaultProps = {
  alert: null,
  showAddNewSiteFields: false,
  user: null,
};

const mapStateToProps = ({ alert, showAddNewSiteFields, user }) => ({
  alert,
  showAddNewSiteFields,
  user,
});

export default connect(mapStateToProps)(AddSite);
