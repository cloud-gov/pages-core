import React from 'react';
import PageListItem from './pageListItem';
import LinkButton from '../../linkButton';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

const filterByPath = (files = [], startingPath = '') => {
  const isRoot = (startingPath === '');
  const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
  const startsWithPath = new RegExp(`^${path}`);
  const f = files.filter((file) => startsWithPath.test(file.path));

  return f;
};

const getPath = (routeParams) => {
  const { splat, fileName } = routeParams;
  let path = '';

  if (splat) {
    path = `${splat}/${fileName}`;
  }
  else if (fileName) {
    path = fileName;
  }

  return path;
};

class Pages extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    siteActions.fetchFiles(this.props.site, getPath(this.props.params));
  }

  componentWillReceiveProps(nextProps) {
    const { params, site } = nextProps;
    const nextFiles = filterByPath(site.files, params.fileName);
    const files = filterByPath(this.props.site.files, this.props.params.fileName);
    if (nextFiles.length === files.length) return;

    siteActions.fetchFiles(site, getPath(params));
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
    const { site } = this.props;

    if (!site) {
      return null;
    }

    const files = filterByPath(site.files, getPath(this.props.params)) || [];

    return (
      <ul className="list-group">
        {files.map((page, index) => {
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
