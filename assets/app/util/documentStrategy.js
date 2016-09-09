import { decodeB64 } from './encoding';

const frontmatterDelimiterRegex = /^---\n([\s\S]*?)---\n/;

const initializeYml = content => {
  return {
    frontmatter: content,
    markdown: ''
  }
};

const initializeMD = content => {
  const matches = content.match(frontmatterDelimiterRegex);

  if (!matches) return { frontmatter: '', markdown: content };

  const frontmatter = matches[1];
  const markdown = content.slice(matches[0].length);

  return { frontmatter, markdown };
};

const isFileObject = maybeFile => {
  return maybeFile && maybeFile.path;
};

const documentStrategy = file => {
  if (!isFileObject(file)) {
    return {
      path: false,
      raw: false,
      frontmatter: '',
      markdown: ''
    };
  }

  const fileType = file.path.split('.').pop();
  const contents = decodeB64(file.content) || '';
  const baseOutput = {
    path: file.path,
    raw: file.content
  };

  const addToBase = obj => {
    return Object.assign({}, baseOutput, obj);
  }

  switch (fileType) {
    case 'yml':
      return addToBase(initializeYml(contents));

    case 'md':
      return addToBase(initializeMD(contents));

    default:
      return addToBase({
        frontmatter: '',
        markdown: contents
      });
  }
};

export default documentStrategy;
