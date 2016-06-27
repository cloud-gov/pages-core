import React from 'react';
import PageListItem from './pageListItem';
import LinkButton from '../linkButton';

const propTypes = {
  pages: React.PropTypes.array
}

class Pages extends React.Component {
  getClasses() {
    return 'usa-button usa-button-outline file-list-item-button';
  }

  getLinkFor(page) {
    const { siteId, branch } = this.props;
    return `/site/${siteId}/edit/${branch}/${page.path}`;
  }

  getButtonCopy(page) {
    return page.type === 'dir' ? 'Open' : 'Edit';
  }

  render() {
    const { pages } = this.props;

    return (
      <ul className="list-group">
        {pages.map((page, index) => {
          return (
            <PageListItem key={index} pageName={page.name}>
              <LinkButton
                text={this.getButtonCopy(page)}
                className={this.getClasses()}
                href={this.getLinkFor(page)} />
            </PageListItem>
          );
        })}
      </ul>
    );
  }
}

Pages.defaultProps = {
  pages: []
};
Pages.propTypes = propTypes;

export default Pages;
