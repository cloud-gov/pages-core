import Glossary from 'glossary-panel';

const terms = [
  {
    term: "Federalist",
    definition: "A cool app that does some cool stuff and is cool",
  },
  {
    term: "Mammal",
    definition: 'warm blooded animal with hair or fur that gives birth to live young',
  },
  {
    term: 'Platypus',
    definition: 'A mammal that breaks all the rules',
  },
];

new Glossary(terms, {}, {
  termClass: 'glossary__term accordion__button',
});
