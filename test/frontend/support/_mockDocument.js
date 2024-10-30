class Document {
  static querySelectorAll(queryStr) {
    if (queryStr === 'meta[name="accessToken"]') {
      return [
        {
          content: 'accessToken',
        },
      ];
    }
    return [];
  }

  /* eslint-disable no-unused-vars */
  static createElement(str) {
    return {};
  }
}

module.exports = Document;
