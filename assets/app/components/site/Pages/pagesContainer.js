import React from 'react';
import PageListItem from './pageListItem';
import NavigationJsonContent from "./navigationJsonContent";

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

const getFilesByPath = (files = [], startingPath = '') => {
  const isRoot = (startingPath === '');
  const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
  const startsWithPath = new RegExp(`^${path}`);
  
  return files.filter((file) => startsWithPath.test(file.path));
};

const hasNavigationJsonContent = (site) => {
  return site["_navigation.json"] && site["_navigation.json"].content;
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
    const nextFiles = getFilesByPath(site.files, getPath(params));
    const files = getFilesByPath(site.files, getPath(params));

    if (files.length && nextFiles.length === files.length) return;

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
    const { site, params } = this.props;
    const { fileName } = params;
    let files;

    if (!site) {
      return null;
    }

    files = getFilesByPath(site.files, getPath(params)) || [];

    if (hasNavigationJsonContent(site)) {
      return <NavigationJsonContent site={ site } />;
    }
    return (
      <ul className="list-group">
        {files.map((page, index) => {
          const { id, branch, defaultBranch } = site;
          const href = this.getLinkFor(page, id, branch || defaultBranch);
          const buttonText = this.getButtonCopy(page);
          return (
            <PageListItem key={ index } pageName={ page.name } href={ href }
                          editButtonText={ buttonText }/>
          );
        })}
      </ul>
    );
  }
}

Pages.propTypes = propTypes;

export default Pages;
