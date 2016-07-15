var jsdom = require('jsdom').jsdom;

// window object for jQuery
var document = global.document = jsdom();
global.window = global.document.defaultView;
global.navigator = 'gecko';

document.createRange = function() {
  return {
    setEnd: function(){},
    setStart: function(){},
    getBoundingClientRect: function(){
        return {right: 0};
    }
  }
};

// Gets around a really annoying "No Transport" error
// related to CORS
if (global.window.XMLHttpRequest) {
  global.XMLHttpRequest = global.window.XMLHttpRequest;
}

// use jsdom window for jQuery
global.window.$ = global.window.jQuery = require('jquery');

// attach base64 string encoding/decoding functions
// to global window for tests
global.window.btoa = function base64_encode(str) {
  return new Buffer(str).toString('base64');
}

global.window.atob = function base64_decode(str) {
  return new Buffer(str, 'base64');
}
