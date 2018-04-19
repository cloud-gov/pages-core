import Glossary from 'glossary-panel';
import definitions from 'public/data/glossary-definitions';

if (Object.keys(definitions).length) {
  new Glossary(definitions, {}, {
    termClass: 'glossary__term accordion__button',
  });
}
