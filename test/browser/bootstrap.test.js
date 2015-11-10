var jsdom = require('jsdom');

// window object for jQuery
global.window = jsdom.jsdom().parentWindow;

// Gets around a really annoying "No Transport" error
// related to CORS
global.XMLHttpRequest = global.window.XMLHttpRequest;

// use jsdom window for jQuery
global.$ = global.jQuery = require('jquery')(window);

// attach base64 string encoding/decoding functions
// to global window for tests
global.window.btoa = function base64_encode(str) {
  return new Buffer(str).toString('base64');
}

global.window.atob = function base64_decode(str) {
  return new Buffer(str, 'base64');
}
