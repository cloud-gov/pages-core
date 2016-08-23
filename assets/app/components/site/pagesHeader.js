import React from 'react';
import LinkButton from '../linkButton';

const propTypes = {
  repository: React.PropTypes.string.isRequired, // Name of the repo
  title: React.PropTypes.string.isRequired, // Title of the section we are on
  siteId: React.PropTypes.number.isRequired,
  branch: React.PropTypes.string.isRequired,
  isPages: React.PropTypes.bool, // Are we on the 'Pages' or index section
  fileName: React.PropTypes.string
};

const defaultPropTypes = {
  fileName: ''
};

class PagesHeader extends React.Component {
  getLinkButtonConfigs() {
    const { isPages, siteId, branch, fileName } = this.props;
    const configs = {
      text: 'View Website',
      alt: 'View this website',
      className: 'usa-button-big pull-right icon icon-view icon-white'
    };

    if (!isPages) {
      return Object.assign({}, configs, {
        target: '_blank',
        href: ''
      });
    }

    return Object.assign({}, configs, {
      text: 'Add a new page',
      alt: 'Add a new page',
      href: `/sites/${siteId}/new/${branch}` + (fileName ? `/${fileName}` : '')
    });
  }

  render() {
    const { repository, title } = this.props;
    const buttonConfigs = this.getLinkButtonConfigs();

    return (
      <div className="usa-grid header">
        <div className="usa-width-two-thirds">
          <img
            className="header-icon"
            src="/images/website.svg"
            alt="Websites icon"/>
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
PagesHeader.defaultPropTypes = defaultPropTypes;

export default PagesHeader;
