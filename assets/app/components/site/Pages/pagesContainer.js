import React from 'react';
import PageListItem from './pageListItem';
import LinkButton from '../../linkButton';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

const filterByPath = (files, startingPath = '/') => {
  const isRoot = (startingPath === '/');
  const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
  const startsWithPath = new RegExp(`^${path}`);
  const f = files.filter((file) => file.path.match(startsWithPath));
  return f;
};

class Pages extends React.Component {
  constructor(props) {
    super(props);
    let path = '/';

    if (props.params.splat) {
      path = `${props.params.splat}/${props.params.fileName}`;
    }
    else if (props.params.fileName) {
      path = props.params.fileName;
    }

    this.state = {
      path,
      files: []
    }
  }
  componentDidMount() {
    siteActions.fetchContent(this.props.site, this.state.path);
  }

  componentWillReceiveProps(nextProps) {
    const { params, site } = nextProps;
    const files = filterByPath(site.files, params.fileName);
    if (files.length === this.state.files.length) return;

    this.setState({
      files
    });

    siteActions.fetchContent(site, params.fileName);
  }

  getLinkFor(page, id, branch) {
    const path = page.path;

    return this.isDir(page) ?
      `/sites/${id}/tree/${path}` : `/sites/${id}/edit/${branch}/${path}`;
  }

  getButtonCopy(file) {
    return this.isDir(file) ? 'Open' : 'Edit';
  }

  isDir(file) {
    return file.type === 'dir';
  }

  render() {
    const { fileName } = this.props.params;

    if (!this.props.site) {
      return null;
    }

    return (
      <ul className="list-group">
        {this.state.files.map((page, index) => {
          const { id, branch, defaultBranch } = this.props.site;

          return (
            <PageListItem key={index} pageName={page.name}>
              <LinkButton href={this.getLinkFor(page, id, branch || defaultBranch)}
                className="usa-button-outline file-list-item-button"
                text={this.getButtonCopy(page)} />
            </PageListItem>
          );
        })}
      </ul>
    );
  }
}

Pages.propTypes = propTypes;

export default Pages;
