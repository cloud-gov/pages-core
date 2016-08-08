import React from 'react';

import PageList from "./pageList";
import PageListItem from './pageListItem';
import NavigationJsonPageList from "./navigationJsonPageList";

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
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

  render() {
    const { site, params } = this.props;

    if (!site) {
      return null;
    }

    if (hasNavigationJsonContent(site)) {
      return <NavigationJsonPageList site={ site } />;
    }

    const path = getPath(params);
    const files = getFilesByPath(site.files, path) || [];
    return <PageList site={ site } files={ files }/>;
  }
}

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

const getFilesByPath = (files = [], startingPath = '') => {
  const isRoot = (startingPath === '');
  const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
  const startsWithPath = new RegExp(`^${path}`);
  
  return files.filter((file) => startsWithPath.test(file.path));
};

const hasNavigationJsonContent = (site) => {
  return site["_navigation.json"] && site["_navigation.json"].content;
};

Pages.propTypes = propTypes;

export default Pages;
