import React from 'react';
import PropTypes from 'prop-types';

import { getSafeRepoName } from '../../../util';

class TemplateSite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      owner: props.defaultOwner,
      repository: '',
      template: props.templateKey,
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  getFormVisible() {
    const { active, index } = this.props;
    return active === index;
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const repository = getSafeRepoName(this.state.repository);
    const site = Object.assign({}, this.state, { repository });

    this.props.handleSubmit(site);
  }

  handleChooseActive() {
    this.props.handleChooseActive(this.props.index);
  }

  render() {
    return (
      <div className="federalist-template-list-item">
        <div className="federalist-template-list-item-img">
          <img
            data-action="name-site"
            className="thumbnail"
            src={this.props.thumb}
            alt={`Thumbnail screenshot for the ${this.props.title} template`}
          />

        </div>
        <div className="federalist-template-list-item-content">
          <h3 className="federalist-template-title">{this.props.title}</h3>
          <p>{this.props.description}</p>
          {this.getFormVisible() ?
            <form
              className="new-site-form"
              onSubmit={this.handleSubmit}
            >
              <label htmlFor="repository">What GitHub account will own your site?</label>
              <input
                name="owner"
                type="text"
                value={this.state.owner}
                onChange={this.handleChange}
              />
              <label htmlFor="repository">Name your new site</label>
              <input
                name="repository"
                type="text"
                value={this.state.repository}
                onChange={this.handleChange}
              />
              <input type="submit" className="usa-button usa-button-primary" value="Create site" />
            </form>
          : null}
          {!this.getFormVisible() &&
            <div>
              <a
                href={this.props.example}
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
              >
                Use this template
              </button>
            </div>
          }
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
};

export default TemplateSite;
