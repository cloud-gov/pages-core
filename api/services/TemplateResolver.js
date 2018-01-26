const templates = require('../../config/templates');

module.exports = {
  getTemplate(templateName) {
    const template = templates[templateName];

    if (!template) {
      const error = new Error(`No such template: ${templateName}`);
      error.status = 400;
      throw error;
    }

    return template;
  },
};
