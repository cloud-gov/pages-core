import React from 'react';

const propTypes = {
  owner: React.PropTypes.string.isRequired,
  branch: React.PropTypes.string.isRequired,
  repo: React.PropTypes.string.isRequired,
  example: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string.isRequired,
  thumb: React.PropTypes.string.isRequired,
  active: React.PropTypes.number.isRequired,
  handleChooseActive: React.PropTypes.func.isRequired,
  index: React.PropTypes.number.isRequired
};

class TemplateSite extends React.Component {
  constructor(props) {
    super(props);

    this.handleChooseActive = this.handleChooseActive.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChooseActive() {
    this.props.handleChooseActive(this.props.index);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  getFormVisible() {
    const { active, index } = this.props;
    return active === index ? "false" : "true";
  }

  render() {
    const { props } = this;

    return (
      <div className="usa-width-one-third template-block">
        <div className="usa-alert usa-alert-info">
          <div className="usa-alert-heading">
            <h3>{props.title}</h3>
          </div>
          <div className="usa-alert-text">
            <a data-action="name-site" className="thumbnail">
              <img
                src={`/images/${props.thumb}.thumb.png`}
                alt={`Thumbnail screenshot for the ${props.title} template`}  />
            </a>
            <p>{props.description}</p>
            <div className="button_wrapper">
              <a className="usa-button usa-button-outline" href={props.example} target="_blank" role="button">Example</a>
              <button
                className="usa-button"
                onClick={this.handleChooseActive}
              >
                Use this template
              </button>
            </div>
            <form
              className="new-site-form"
              aria-hidden={this.getFormVisible()}
              onSubmit={this.handleSubmit}
            >
              <label for="site-name">Name your new site</label>
              <input name="site-name" type="text" />
              <input type="submit" value="Create site" />
            </form>
          </div>
        </div>
      </div>
    );
  }
}

TemplateSite.propTypes = propTypes;

export default TemplateSite;
