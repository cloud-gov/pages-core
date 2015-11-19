module.exports.encodeB64 = function(s) {
  return window.btoa(unescape(encodeURIComponent(s)));
};

module.exports.decodeB64 = function(s) {
  return decodeURIComponent(escape(window.atob(s)));
};
