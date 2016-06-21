import React from 'react';
import PageListItem from './pageListItem';

const propTypes = {
  pages: React.PropTypes.array
}

class Pages extends React.Component {
  render() {
    const { pages } = this.props;

    return (
      <ul className="list-group">
        {pages.map((page, index) => {
          return (
            <PageListItem key={index} page={page} />
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
