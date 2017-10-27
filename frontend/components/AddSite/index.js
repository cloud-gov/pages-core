import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { connect } from 'react-redux';

import TemplateSiteList from './TemplateSiteList';
import AddRepoSiteForm from './AddRepoSiteForm';
import AlertBanner from '../alertBanner';

import siteActions from '../../actions/siteActions';
import addNewSiteFieldsActions from '../../actions/addNewSiteFieldsActions';

const propTypes = {
  storeState: PropTypes.shape({
    user: PropTypes.shape({
      username: PropTypes.string,
      id: PropTypes.number,
    }),
    error: PropTypes.string,
  }),
  showAddNewSiteFields: PropTypes.bool,
};

const defaultProps = {
  storeState: null,
  showAddNewSiteFields: false,
};

export class AddSite extends React.Component {
  constructor(props) {
    super(props);

    autoBind(
      this,
      'onAddRepoSiteSubmit',
      'onSubmitTemplate'
    );
  }

  componentWillUnmount() {
    // dispatch the action to hide the additional new site fields
    // when this component is unmounted
    addNewSiteFieldsActions.hideAddNewSiteFields();
  }

  onAddRepoSiteSubmit({ repoUrl, engine, defaultBranch }) {
    const owner = repoUrl.split('/')[3];
    const repository = repoUrl.split('/')[4];

    if (!engine && !defaultBranch) {
      siteActions.addUserToSite({ owner, repository });
    } else {
      siteActions.addSite({ owner, repository, engine, defaultBranch });
    }
  }

  onSubmitTemplate(site) {
    siteActions.addSite(site);
  }

  defaultOwner() {
    const userState = this.props.storeState.user;
    if (userState.data) {
      return userState.data.username;
    }
    return '';
  }

  render() {
    return (
      <div>
        <AlertBanner message={this.props.storeState.error} />
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <h1>Make a new site</h1>
          </div>
        </div>
        <div className="usa-grid">
          <div className="usa-width-one-whole">
            <p>
              There are a few different ways you can add sites to Federalist.
              You can start with a brand new site by selecting one of our template sites below.
              Or you can specify the GitHub repository where your site&#39;s code lives.
            </p>
          </div>
        </div>
        <TemplateSiteList
          handleSubmitTemplate={this.onSubmitTemplate}
          defaultOwner={this.defaultOwner()}
        />

        <div className="usa-grid">
          <h2>Or add your own GitHub repository</h2>
        </div>

        <AddRepoSiteForm
          showAddNewSiteFields={this.props.showAddNewSiteFields}
          onSubmit={this.onAddRepoSiteSubmit}
        />
      </div>
    );
  }
}

AddSite.propTypes = propTypes;
AddSite.defaultProps = defaultProps;

const mapStateToProps = ({ showAddNewSiteFields }) => ({ showAddNewSiteFields });

export default connect(mapStateToProps)(AddSite);
