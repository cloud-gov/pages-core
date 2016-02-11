/**
 * NewSiteFromTemplateElement
 *
 * A page object API around the New Site Template component.
 */

var BaseFederalistElement = require('./baseFederalist.element');

function NewSiteFromTemplateElement () {
  BaseFederalistElement.apply(this, arguments);
}

NewSiteFromTemplateElement.prototype = Object.create(BaseFederalistElement.prototype);

NewSiteFromTemplateElement.prototype.useThisTemplateElement = function () {
  return this.element('a[data-action=name-site]');
};

NewSiteFromTemplateElement.prototype.setNewSiteName = function (siteName) {
  return this.setValue('form.new-site-form input[name=site-name]', siteName);
};

NewSiteFromTemplateElement.prototype.submitNewSiteName = function (siteName) {
  return this.submitForm('form.new-site-form input[type=submit]');
};


module.exports = NewSiteFromTemplateElement;
