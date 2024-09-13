import React from 'react';
import PropTypes from 'prop-types';

import { ORGANIZATIONS } from '../../../propTypes';
import { hasOrgs } from '../../../selectors/organization';
import { getSafeRepoName } from '../../../util';
import UserOrgSelect from '../../organization/UserOrgSelect';

class TemplateSite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      owner: props.defaultOwner,
      repository: '',
      template: props.templateKey,
      templateOrganizationId: '',
      touched: false,
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validateOrgSelect = this.validateOrgSelect.bind(this);
  }

  handleChange(event) {
    const { name, value } = event.target;
    const orgValidation = this.validateOrgSelect(name, value);
    this.setState({ [name]: value, ...orgValidation });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { handleSubmit, organizations } = this.props;
    const { repository, templateOrganizationId, ...rest } = this.state;
    const validOrg = this.validateOrgSelect('templateOrganizationId', templateOrganizationId);

    if (!validOrg.touched || validOrg.error) {
      return this.setState({ ...validOrg });
    }

    const organizationId = hasOrgs(organizations) ? templateOrganizationId : null;
    const safeRepository = getSafeRepoName(repository);
    const site = {
      ...rest,
      organizationId,
      repository: safeRepository,
    };

    return handleSubmit(site);
  }

  handleChooseActive() {
    const { index, handleChooseActive } = this.props;
    handleChooseActive(index);
  }

  getFormVisible() {
    const { active, index } = this.props;
    return active === index;
  }

  validateOrgSelect(name, value) {
    const { organizations } = this.props;

    if (name === 'templateOrganizationId' && hasOrgs(organizations) && !value) {
      return { touched: true, error: 'Please select an organization' };
    }

    return { touched: true, error: null };
  }

  render() {
    const {
      description, example, organizations, thumb, title,
    } = this.props;
    const {
      error, owner, templateOrganizationId, repository, touched,
    } = this.state;

    return (
      <div className="federalist-template-list-item">
        <div className="federalist-template-list-item-img">
          <img
            data-action="name-site"
            className="thumbnail"
            src={thumb}
            alt={`Thumbnail screenshot for the ${title} template`}
          />

        </div>
        <div className="federalist-template-list-item-content">
          <h3 className="federalist-template-title">{title}</h3>
          <p>{description}</p>
          {this.getFormVisible()
            ? (
              <form
                className="new-site-form"
                onSubmit={this.handleSubmit}
              >
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="owner">What GitHub account will own your site?</label>
                <input
                  id="owner"
                  name="owner"
                  type="text"
                  value={owner}
                  onChange={this.handleChange}
                />
                {
                  hasOrgs(organizations) ? (
                    <div className="form-group">
                      <UserOrgSelect
                        className="usa-select"
                        error={error}
                        id="templateOrganizationId"
                        name="templateOrganizationId"
                        value={templateOrganizationId}
                        onChange={this.handleChange}
                        orgData={organizations.data}
                        mustChooseOption
                        touched={touched}
                      />
                    </div>
                  ) : null
                }
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="repository">Name your new site</label>
                <input
                  id="repository"
                  name="repository"
                  type="text"
                  value={repository}
                  onChange={this.handleChange}
                />
                <input type="submit" className="usa-button usa-button-primary" value="Create site" />
              </form>
            )
            : null}
          {!this.getFormVisible()
            && (
            <div>
              <a
                href={example}
                target="_blank"
                rel="noopener noreferrer"
                role="button"
                className="view-template-link"
              >
                View sample
              </a>
              <br />
              <button
                className="usa-button"
                onClick={this.handleChooseActive}
                type="button"
              >
                Use this template
              </button>
            </div>
            )}
        </div>
      </div>
    );
  }
}

TemplateSite.propTypes = {
  templateKey: PropTypes.string.isRequired,
  defaultOwner: PropTypes.string.isRequired,
  example: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  thumb: PropTypes.string.isRequired,
  active: PropTypes.number.isRequired,
  handleChooseActive: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  organizations: ORGANIZATIONS.isRequired,
};

export default TemplateSite;
