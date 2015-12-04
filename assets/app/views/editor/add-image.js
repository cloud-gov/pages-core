var fs = require('fs');

var _ = require('underscore');
var Backbone = require('backbone');

var html = _.template(fs.readFileSync(__dirname + '/../../templates/editor/add-image.html').toString());

var AddImageView = Backbone.View.extend({
  events: {
    'change [type=file]': 'uploadFileSelected',
    'click .image-card.existing': 'existingSelected',
    'click [data-action=image-confirm]': 'useAsset',
    'click [data-action=image-cancel]': 'remove'
  },
  initialize: function () {
    var github = window.federalist.github,
        assets = github.assets.filter(function(a) {
          var isImage = a.name.match(/\.jpg|\.jpeg|\.png|\.gif/);
          return isImage;
        });

    this.selectedImage = false;
    this.el.innerHTML = html({ assets: assets });
  },
  uploadNewAsset: function (file) {
    var sizeLimit = (1024 * 1024) * 5; // 5 megabytes

    if (file.size < sizeLimit) {
      window.federalist.dispatcher.trigger('asset:upload:selected', file);
    }
    else {
      alert('the file is too big, look at console for more info');
      console.log('size limit', sizeLimit);
      console.log('file size', file.size);
    }
  },
  useAsset: function (e) {
    e.preventDefault(); e.stopPropagation();

    if (!this.selectedImage) return this.remove();

    var self = this,
        selectedImage = $(this.selectedImage).children('img'),
        selectedFiles = $(this.selectedImage).children('[type=file]');

    if (selectedFiles.length > 0) {
      var file = $('#asset')[0].files[0];
      this.uploadNewAsset(file);
      window.federalist.dispatcher.once('asset:upload:uploaded', function(json){
        var path = json.content['download_url'];
        self.trigger('asset:selected', {
          src: path,
          title: 'Freshly uploaded'
        });
      });
    }
    else {
      this.trigger('asset:selected', {
        src: selectedImage.attr('src'),
        title: selectedImage.attr('title')
      });
    }

  },
  triggerFilePicker: function (e) {
    e.preventDefault(); e.stopPropagation();
    //this.$('[type=file]').click();
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
