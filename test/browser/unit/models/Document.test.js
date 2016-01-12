var fs = require('fs');
var path = require('path');

var assert = require('assert');

var Document = require('./../../../../assets/app/models/Document');

var data = {
  yml: fs.readFileSync(path.resolve(__dirname, '../data/settings.yml')).toString(),
  markdown: fs.readFileSync(path.resolve(__dirname, '../data/document.md')).toString(),
  hr: fs.readFileSync(path.resolve(__dirname, '../data/horizontal-rule.md')).toString()
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
    var document = new Document({ content: data.yml, fileExt: 'yml' });
    assert.equal(document.content, false);
  });

  it('should export YML just fine', function() {
    var document = new Document({ content: data.yml, fileExt: 'yml' });
    var exported = document.toMarkdown();
    assert.equal(exported, data.yml);
  });

  it('should create a model with YML & markdown', function() {
    var document = new Document({ content: data.markdown, fileExt: 'md' });
    assert.notEqual(document.frontMatter, false);
    assert.notEqual(document.content, false);
  });

  it('should export YML & markdown just fine', function() {
    var document = new Document({ content: data.markdown, fileExt: 'md' });
    var exported = document.toMarkdown();
    assert.equal(exported, data.markdown);
  });

  it('should handle horizontal rules in body text', function () {
    var document = new Document({ content: data.hr, fileExt: 'md' });
    var exported = document.toMarkdown();
    assert.equal(exported, data.hr);
  })


});

after(function() {

});
