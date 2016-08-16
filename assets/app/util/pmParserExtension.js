import {
  defaultMarkdownParser,
  defaultMarkdownSerializer
} from 'prosemirror/dist/markdown';

const serializerNodes = Object.assign({}, defaultMarkdownSerializer.nodes, {
  image: (state, node) => {
    const alt = state.esc(node.attrs.alt || '');
    const src = state.esc(['{{ site.baseurl }}', node.attrs.src].join('/'));
    const title = node.attrs.title;

    state.write(`![${alt}](${src})`);
  }
});

const parserNodes = Object.assign({}, defaultMarkdownParser.nodes, {
  image: {
    node: "image",
    attrs: tok => ({
      src: tok.attrGet("src")
        .replace('https://raw.githubusercontent.com/', '')
        .split('/').slice(-2).join('/'),
      title: tok.attrGet("title") || null,
      alt: tok.children[0] && tok.children[0].content || null
    })}
});

defaultMarkdownParser.nodes = parserNodes;
defaultMarkdownSerializer.nodes = serializerNodes;

export {
  defaultMarkdownParser,
  defaultMarkdownSerializer
};
