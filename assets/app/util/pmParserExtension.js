/**
 * Overrides prosemirror's default markdown parser and serializer
 * with custom deserialize and serialize methods for an image node.
 */

import {
  defaultMarkdownParser,
  defaultMarkdownSerializer
} from 'prosemirror/dist/markdown';

const serializerNodes = Object.assign({}, defaultMarkdownSerializer.nodes, {
  image: (state, node) => {
    const alt = state.esc(node.attrs.alt || '');
    // We need to add the base URL of the user's hosted federalist site to the
    // markdown so it can be interpolated on build
    const cleanSrc = node.attrs.src
      .replace('https://raw.githubusercontent.com/', '')
      .split('/').slice(-2).join('/');
    const src = state.esc(['{{ site.baseurl }}', cleanSrc].join('/'));
    const title = node.attrs.title;

    state.write(`![${alt}](${src})`);
  }
});

const parserNodes = Object.assign({}, defaultMarkdownParser.nodes, {
  image: {
    node: "image",
    attrs: tok => ({
      src: tok.attrGet('src') || null,
      title: tok.attrGet("title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    })}
});

defaultMarkdownParser.nodes = parserNodes;
defaultMarkdownSerializer.nodes = serializerNodes;

const markdownParser = defaultMarkdownParser;
const markdownSerializer = defaultMarkdownSerializer;

export {
  markdownParser,
  markdownSerializer
};
