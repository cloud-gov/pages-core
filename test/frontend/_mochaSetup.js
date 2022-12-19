/*
This file has an underscore at the front of its name so that it will
be first loaded by "mocha --recursive ./test/frontend".
*/

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { JSDOM } from 'jsdom';

global.Notification = require('./support/_mockNotification');
global.document = require('./support/_mockDocument');

/*
Mocha doesn't know how to handle special webpack functionality
that allows require-ing non-js files. This file overrides require for
those types with a noop function.
*/

const ignoredExtensions = [
  '.css', '.scss', '.jpg', '.jpeg', '.png', '.gif', '.svg',
];

ignoredExtensions.forEach((ext) => {
  require.extensions[ext] = () => null;
});

// JSDOM setup https://enzymejs.github.io/enzyme/docs/guides/jsdom.html
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
};
console.log('early setup of global')
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
copyProps(window, global);

configure({ adapter: new Adapter() });

// additional setup for testing
process.env.APP_HOSTNAME = '/';
process.env.PRODUCT = 'federalist';
