import React from 'react';
import PageListItem from './pageListItem';
import LinkButton from '../../linkButton';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Pages extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    siteActions.fetchFiles(this.props.site, this.getPath(this.props.params));
  }

  componentWillReceiveProps(nextProps) {
    const { params, site } = nextProps;
    const nextFiles = this.getFilesByPath(site.files, this.getPath(params));
    const files = this.getFilesByPath(site.files, this.getPath(params));

    if (files.length && nextFiles.length === files.length) return;

    siteActions.fetchFiles(site, this.getPath(params));
  }

  getLinkFor(page, id, branch) {
    const path = page.path;

    return this.isDir(page) ?
      `/sites/${id}/tree/${path}` : `/sites/${id}/edit/${branch}/${path}`;
  }

  getPath(routeParams) {
    const { splat, fileName } = routeParams;
    let path = '';

    if (splat) {
      path = `${splat}/${fileName}`;
    }
    else if (fileName) {
      path = fileName;
    }

    return path;
  }


  getFilesByPath(files = [], startingPath = '') {
    const isRoot = (startingPath === '');
    const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
    const startsWithPath = new RegExp(`^${path}`);

    return files.filter((file) => startsWithPath.test(file.path));
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

    files = this.getFilesByPath(site.files, this.getPath(params)) || [];

    return (
      <ul className="list-group">
        {files.map((page, index) => {
          const { id, branch, defaultBranch } = site;

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
