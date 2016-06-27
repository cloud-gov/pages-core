import React from 'react';
import LinkButton from '../linkButton';

const propTypes = {
  repository: React.PropTypes.string, // Name of the repo
  title: React.PropTypes.string, // Title of the section we are on
  isPages: React.PropTypes.bool // Are we on the 'Pages' or index section
};

class PagesHeader extends React.Component {//({repository, title}) =>
  getButtonConfigs(isPages) {
    const configs = {
      text: 'View Website',
      target: '_blank',
      alt: 'View this website',
      href: '',
      className: 'usa-button-big pull-right icon icon-view icon-white'
    };

    if (!isPages) {
      return configs;
    }

    return Object.assign({}, configs, {
      text: 'Add a new page',
      target: false,
      alt: 'Add a new page',
      href: '/site/new'
    });
  }

  render() {
    const { repository, title, isPages } = this.props;
    const buttonConfigs = this.getButtonConfigs(isPages);

    return (
      <div className="usa-grid header">
        <div className="usa-width-two-thirds">
          <img className="header-icon" src="/images/website.svg" alt="Websites icon" />
          <div className="header-title">
            <h1>{repository}</h1>
            <p>{title}</p>
          </div>
        </div>
        <div className="usa-width-one-third">
          <LinkButton {...buttonConfigs} />
        </div>
      </div>
    );
  }
}

PagesHeader.propTypes = propTypes;

export default PagesHeader;
