import React from 'react';
import isEqual from 'lodash.isequal';
import PageList from './pageList';
import PageListItem from './pageListItem';
import NavigationJsonPageList from './navigationJsonPageList';
import hasConfig from '../../higherOrder/hasConfig';

import siteActions from '../../../actions/siteActions';

const propTypes = {
  site: React.PropTypes.object
};

class Pages extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    const { params, site } = nextProps;
    const { params: oldParams, site: oldSite } = this.props;
    const nextFiles = getFilesByPath(site.files, getPath(params));
    const files = getFilesByPath(oldSite.files, getPath(oldParams));
    const filesAreTheSame = isEqual(files, nextFiles);

    if (filesAreTheSame) return;

    fetchFiles(site, params);
  }

  render() {
    const { site, params } = this.props;

    if (!site) {
      return null;
    }

    if (hasNavigationJsonContent(site)) {
      return <NavigationJsonPageList site={ site }/>;
    }

    const path = getPath(params);
    const files = getFilesByPath(site.files, path);

    return <PageList site={ site } files={ files }/>;
  }
}

const fetchFiles = (site, params) => {
  siteActions.fetchFiles(site, getPath(params));
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

const getFilesByPath = (files = [], startingPath = '') => {
  const isRoot = (startingPath === '');
  const path = (!isRoot) ? `${startingPath}/` : '((?!/).)*$';
  const startsWithPath = new RegExp(`^${path}`);

  return files.filter((file) => startsWithPath.test(file.path));
};

const hasNavigationJsonContent = (site) => {
  const navigationJSON = site['_navigation.json'];
  return navigationJSON instanceof Array;
};

Pages.propTypes = propTypes;

export default hasConfig(Pages);
