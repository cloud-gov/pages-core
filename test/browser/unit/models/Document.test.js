var fs = require('fs');
var path = require('path');

var assert = require('assert');

var Document = require('./../../../../assets/app/models/Document');

var data = {
  yml: fs.readFileSync(path.resolve(__dirname, '../data/settings.yml')).toString(),
  markdown: fs.readFileSync(path.resolve(__dirname, '../data/document.md')).toString()
};

before(function() {

});

describe('Document model', function () {
  it('should create model', function () {
    assert.doesNotThrow(function() {
      var document = new Document({});
    });
  });

  it('should create a model with just YML', function() {
    var document = new Document({ yml: data.yml });
    assert.equal(document.content, false);
  });

  it('should export YML just fine', function() {
    var document = new Document({ yml: data.yml });
    var exported = document.toMarkdown();
    assert.equal(exported, data.yml);
  });

  it('should create a model with YML & markdown', function() {
    var document = new Document({ markdown: data.markdown });
    assert.notEqual(document.frontMatter, false);
    assert.notEqual(document.content, false);
  });

  it('should export YML & markdown just fine', function() {
    var document = new Document({ markdown: data.markdown });
    var exported = document.toMarkdown();
    assert.equal(exported, data.markdown);
  });


});

after(function() {

});
