var fs = require('fs');

var _ = require('underscore');
var Backbone = require('backbone');

var templateHtml = fs.readFileSync(__dirname + '/../../../../templates/editor/add-image.html').toString();

var AddImageView = Backbone.View.extend({
  template: _.template(templateHtml),
  events: {
    'click #upload-card a': 'triggerFilePicker',
    'change [type=file]': 'uploadFileSelected',
    'click .image-card.existing': 'existingSelected',
    'click [data-action=image-confirm]': 'useAsset',
    'click [data-action=image-cancel]': 'remove'
  },
  initialize: function () {
    this.github = window.federalist.github;
    this.selectedImage = false;
    this.el.innerHTML = this.template({
      assets: this.github.filterAssets('images')
    });
  },
  disableButton: function (selector) {
    var button = this.$(selector);
    button.attr('disabled', true);
    button.removeClass('usa-button-secondary');
    button.addClass('usa-button-disabled');
  },
  uploadNewAsset: function (file) {
    var sizeLimit = (1024 * 1024) * 5; // 5 megabytes

    if (file.size < sizeLimit) {
      $('#upload-status-result').show().text('Uploading...');
      this.disableButton('[data-action=image-confirm]');
      this.disableButton('[data-action=image-cancel]');
      window.federalist.dispatcher.trigger('github:upload:selected', file);
    }
    else {
      alert('the file is too big, look at console for more info');
      console.log('you are trying to upload a file that is too big');
      console.log('\tsize limit (mbs)', (sizeLimit / (1024 * 1024)));
      console.log('\tfile size (mbs)', (file.size / (1024 * 1024)));
    }
  },
  useAsset: function (e) {
    e.preventDefault(); e.stopPropagation();

    if (!this.selectedImage) return this.remove();

    var self = this,
        selectedImage = $(this.selectedImage).children('img'),
        selectedFiles = $(this.selectedImage).children('[type=file]'),
        repo = [this.github.owner, this.github.name].join('/'),
        branch = this.github.branch,
        fileName;

    if (selectedFiles.length > 0) {
      var file = $('#asset')[0].files[0];
      this.uploadNewAsset(file);
      window.federalist.dispatcher.once('github:upload:success', function(json){
        var path = json.content['download_url'];
        self.trigger('asset:selected', {
          src: path,
          repo: repo,
          branch: branch,
          title: 'Freshly uploaded'
        });
      });
    }
    else {
      fileName = selectedImage.attr('src').split('/' + this.github.uploadDir + '/')[1];
      this.trigger('asset:selected', {
        src: selectedImage.attr('src'),
        repo: repo,
        branch: branch,
        filePath: [this.github.uploadDir, fileName].join('/'),
        title: selectedImage.attr('title')
      });
    }

  },
  triggerFilePicker: function (e) {
    e.preventDefault(); e.stopPropagation();
    this.$('[type=file]').click();
  },
  uploadFileSelected: function (e) {
    e.preventDefault(); e.stopPropagation();
    var uploadCard = $('#upload-card')[0];
    this.deselectCurrentCard();
    this.selectCard(uploadCard);
  },
  existingSelected: function (e) {
    e.preventDefault(); e.stopPropagation();
    var tagName = e.target.tagName.toLowerCase(),
        target;

    if (tagName === 'img' || tagName === 'span') {
      target = $(e.target).parents('.image-card')[0];
    }
    else if (tagName === 'div') {
      target = e.target;
    }

    if (this.selectedImage == target) {
      this.deselectCurrentCard();
      return;
    }

    this.selectCard(target);
  },
  deselectCurrentCard: function () {
    $(this.selectedImage).removeClass('selected');
    this.selectedImage = false;
  },
  selectCard: function (target) {
    if (this.selectedImage) this.deselectCurrentCard();
    $(target).addClass('selected');
    this.selectedImage = target;
  }
});

module.exports = AddImageView;
