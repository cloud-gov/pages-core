import PropTypes from 'prop-types';
import React from 'react';

const propTypes = {
  name: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  branch: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  example: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  thumb: PropTypes.string.isRequired,
  active: PropTypes.number.isRequired,
  handleChooseActive: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

class TemplateSite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      owner: props.defaultOwner,
      repository: '',
      template: props.name,
    };

    this.handleChooseActive = this.handleChooseActive.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChooseActive() {
    this.props.handleChooseActive(this.props.index);
  }

  getSafeRepoName(name) {
    return name
      .replace(/[^\w\.]+/g, '-')
      .replace(/^-+/g, '')
      .replace(/-+$/g, '');
  }

  handleSubmit(event) {
    event.preventDefault();
    const repository = this.getSafeRepoName(this.state.repository);
    const site = Object.assign({}, this.state, { repository })

    this.props.handleSubmit(site);
  }

  handleChange(event) {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  getFormVisible() {
    const { active, index } = this.props;
    return active === index;
  }

  render() {
    const { props } = this;

    return (
      <div className="template-block">
        <div className="usa-alert usa-alert-info">
          <div className="usa-alert-heading">
            <h3>{props.title}</h3>
          </div>
          <div className="usa-alert-text">
            <a data-action="name-site" className="thumbnail">
              <img
                src={props.thumb}
                alt={`Thumbnail screenshot for the ${props.title} template`} />
            </a>
            <p>{props.description}</p>
            <div className="button_wrapper">
              <a
                className="usa-button usa-button-outline"
                href={props.example}
                target="_blank"
                role="button"
              >
                Example
              </a>
              <button
                className="usa-button"
                onClick={this.handleChooseActive}
              >
                Use this template
              </button>
            </div>
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
                  onChange={this.handleChange} />
                <label htmlFor="repository">Name your new site</label>
                <input
                  name="repository"
                  type="text"
                  value={this.state.repository}
                  onChange={this.handleChange} />
                <input type="submit" value="Create site" />
              </form>
            : null}
          </div>
        </div>
      </div>
    );
  }
}

TemplateSite.propTypes = propTypes;

export default TemplateSite;
