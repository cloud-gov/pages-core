
/*
Mocha doesn't know how to handle special webpack functionality
that allows require-ing non-js files. This file overrides require for
those types with a noop function.

This file has an underscore at the front of its name so that it will
be first loaded by "mocha --recursive ./test/frontend".
*/

const ignoredExtensions = [
  '.css', '.scss', '.jpg', '.jpeg', '.png', '.gif', '.svg',
];

ignoredExtensions.forEach((ext) => {
  require.extensions[ext] = () => null;
});

require('./setup')
