import React from 'react';
import PropTypes from 'prop-types';

import { hasOrgs } from '@selectors/organization';
import { getSafeRepoName } from '@util';
import UserOrgSelect from '@shared/UserOrgSelect';
import { ORGANIZATIONS } from '../../../propTypes';

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
      <li className="federalist-template-list-item usa-card usa-card--flag flex-1 tablet-lg:grid-col-6">
        <div className="usa-card__container bg-base-lightest">
          <div className="federalist-template-list-item-img usa-card__media">
            <div className="usa-card__img">
              <img
                data-action="name-site"
                className="thumbnail"
                src={thumb}
                alt={`Thumbnail screenshot for the ${title} template`}
              />
            </div>
          </div>
          <div className="usa-card__header">
            <h3 className="usa-card__heading federalist-template-title">{title}</h3>
          </div>
          <div className="usa-card__body federalist-template-list-item-content">
            <p>{description}</p>
            {this.getFormVisible()
              ? (
                <form
                  className="new-site-form"
                  onSubmit={this.handleSubmit}
                >
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="usa-label text-bold" htmlFor="owner">What GitHub account will own your site?</label>
                  <input
                    id="owner"
                    name="owner"
                    type="text"
                    value={owner}
                    className="usa-input"
                    onChange={this.handleChange}
                  />
                  {
                    hasOrgs(organizations) ? (
                      <div className="form-group">
                        <UserOrgSelect
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
                  <label className="usa-label text-bold" htmlFor="repository">Name your new site</label>
                  <input
                    className="usa-input"
                    id="repository"
                    name="repository"
                    type="text"
                    value={repository}
                    onChange={this.handleChange}
                  />
                  <input type="submit" className="usa-button usa-button-primary margin-top-1" value="Create site" />
                </form>
              )
              : null}
          </div>
          <div className="usa-card__footer">
            {!this.getFormVisible()
              && (
              <div>
                <p>
                  <a
                    href={example}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="button"
                    className="view-template-link"
                  >
                    View sample
                  </a>
                </p>
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
      </li>
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
