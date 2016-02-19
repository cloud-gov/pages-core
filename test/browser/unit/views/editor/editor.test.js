var _ = require('underscore');
var assert = require('assert');
var mocha = require('mocha');

var EditorView = require('./../../../../../assets/app/views/site/pages/editor/editor');

describe('edit-file view', function () {

  beforeEach(function () {

  });

  describe('when view is initialized', function () {
    describe('without model', function () {
      it('should throw exception', function () {
        assert.throws(function () {
          new EditorView();
        });
      });
    });
  });

  describe('cleanContent()', function () {
    it('should not alter text unncessarily', function () {
      var model = {
            owner: '18f',
            name: 'federalist',
            branch: 'master'
          },
          expected = 'Yo',
          actual = EditorView.prototype.cleanContent(expected, model);

      assert.equal(actual, expected);
    });

    it('should replace baseUrl mentions', function () {
      var model = {
            owner: '18f',
            name: 'federalist',
            branch: 'master'
          },
          expected = 'Yo https://raw.githubusercontent.com/18f/federalist/master',
          actual = EditorView.prototype.cleanContent('Yo {{ site.baseurl }}', model);

      assert.equal(actual, expected);
    });
  });

  describe('parseSettings()', function () {
    it('should do nothing with no settingsFields', function () {
      EditorView.prototype.settingsFields = {};
      var doc = {
            frontMatter: "title: Test\nlayout: test-layout\nfoo: bar\n"
          },
          actual = EditorView.prototype.parseSettings(doc);

      assert.equal(actual.whitelist.length, 0);
      assert.equal(actual.remaining, doc.frontMatter);
    });

    it('should whitelist settingsFields', function () {
      EditorView.prototype.settingsFields = {'title': 'text'}
      var doc = {
            frontMatter: "title: Test\nlayout: test-layout\nfoo: bar\n"
          },
          actual = EditorView.prototype.parseSettings(doc),
          expectedRemaining = 'layout: test-layout\nfoo: bar\n';

      assert.equal(actual.whitelist.length, 1);
      assert.equal(actual.whitelist[0].name, 'title');
      assert.equal(actual.remaining, expectedRemaining);
    });
  });

  describe('getSettingsDisplayStyle()', function () {
    it('should return "only" for .yml documents', function () {
      var doc = {
            fileExt: 'yml'
          },
          expected = 'only',
          actual = EditorView.prototype.getSettingsDisplayStyle(doc);

      assert.equal(actual, expected);
    });

    it('should return "whitelist" for .md documents with settings', function () {
      var doc = {
            fileExt: 'md',
            frontMatter: 'foo: bar'
          },
          expected = 'whitelist',
          actual = EditorView.prototype.getSettingsDisplayStyle(doc);

      assert.equal(actual, expected);
    });

    it('should return "regular" for .md documents without settings', function () {
      var doc = {
            fileExt: 'md',
            frontMatter: ''
          },
          expected = 'regular',
          actual = EditorView.prototype.getSettingsDisplayStyle(doc);

      assert.equal(actual, expected);
    });

  });

  describe('toIsoDateString()', function () {
    it('should return a date string', function () {
      var expected = '2016-01-05',
          actual = EditorView.prototype.toIsoDateString(expected);

      assert.equal(actual, expected);
    });
  });

  describe('fileNameFromTitle()', function () {
    it('should return a title if supplied nothing', function () {
      assert.doesNotThrow(function () {
        var title = EditorView.prototype.fileNameFromTitle();
      });
    });

    it('should return the same title if supplied', function () {
      var expected = 'title-things',
          actual = EditorView.prototype.fileNameFromTitle(expected);

      assert.equal(actual, expected);
    });
  });

  afterEach(function () {

  });

});
