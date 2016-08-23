export function encodeB64(s) {
  return window.btoa(unescape(encodeURIComponent(s)));
};

export function decodeB64(s) {
  try {
    return decodeURIComponent(escape(window.atob(s)));
  } catch (e) {
    return;
  }
};
