import { decodeB64 } from './encoding';

const frontmatterDelimiterRegex = /^---\n([\s\S]*?)---\n/;

// Ensures yaml string present in the file's frontmatter
// is available under the correct key in the document object.
// Does not perform any conversion or parsing of yaml content
const initializeYml = content => {
  return {
    frontmatter: content,
    markdown: ''
  }
};

// Ensures content identified as markdown is placed under the correct key in
// the document object. Markdown content is treated as a string.
// Does not perform any conversion or parsing of markdown content.
const initializeMD = content => {
  const contentWithYml = content.match(frontmatterDelimiterRegex);

  if (!contentWithYml) return { frontmatter: '', markdown: content };

  const frontmatter = contentWithYml[1];
  const markdown = content.slice(contentWithYml[0].length);

  return { frontmatter, markdown };
};

const isFileObject = maybeFile => {
  return !!(maybeFile && maybeFile.path && maybeFile.content);
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
  const baseDocumentObject = {
    path: file.path,
    raw: file.content
  };

  const addToBase = obj => {
    return Object.assign({}, baseDocumentObject, obj);
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
