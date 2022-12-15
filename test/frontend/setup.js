import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// JSDOM setup https://enzymejs.github.io/enzyme/docs/guides/jsdom.html
import { JSDOM } from 'jsdom';

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
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
copyProps(window, global);

configure({ adapter: new Adapter() });

process.env.APP_HOSTNAME = '/';
process.env.PRODUCT = 'federalist';
