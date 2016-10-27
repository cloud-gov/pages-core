import fetch from './fetch';
import store from '../store';

const S3_BASE_URL = 'https://s3-us-gov-west-1.amazonaws.com/';

const getS3FileURL = (site, file) => {
  const { repository, owner, name, siteRoot = ''} = site;
  const bucketPath = /^http\:\/\/(.*)\.s3\-website\-(.*)\.amazonaws\.com/;
  const match = siteRoot.match(bucketPath);
  const bucket = match && match[1];
  const root = bucket ? `${S3_BASE_URL}${bucket}` : siteRoot;

  return `${root}/site/${owner}/${repository}/${file}`;
};

const fileToObject = (file, content) => {
  const output = {};
  output[file] = content;
  return output;
};

const s3 =  {
  fetch(url, params = {}) {
    return fetch(url, params).then((data) => {
      return data;
    });
  },

  fetchFile(site, file) {
    return this.fetch(getS3FileURL(site, file), {
      // necessary to not trigger an options request when hitting s3
      headers: {
        'Content-Type': 'text/plain'
      }
    }).then(fileToObject.bind(null, file));
  }
};

export default s3;
