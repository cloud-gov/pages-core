module.exports = class Notification {
  constructor(title, options = {}) {
	  this.title = title;
	  this.options = options;
	}

  static requestPermission() {
    return 'granted';
  }
}