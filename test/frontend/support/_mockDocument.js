class Document {
  
  static querySelectorAll(queryStr) {
  	if (queryStr === 'meta[name="accessToken"]') {
  		return [{ content: 'accessToken' }];
  	}
    return [];
  }

  static createElement(str) {
    return {};
  }
}

module.exports = Document;
