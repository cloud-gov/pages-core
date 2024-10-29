const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const templateName = 'template';
const fakeTemplate = {
  owner: 'somebody',
  repo: 'some-thing',
  branch: 'staging',
};
const TemplateResolver = proxyquire('../../../../api/services/TemplateResolver', {
  '../../config/templates': {
    [templateName]: fakeTemplate,
  },
});

describe('TemplateResolver', () => {
  it(`returns a template from templates object
    when supplied a valid template name`, () => {
    expect(TemplateResolver.getTemplate(templateName)).to.deep.equal(fakeTemplate);
  });

  it('throws an error object when a template cannot be found', () => {
    expect(
      TemplateResolver.getTemplate.bind(TemplateResolver, 'not-a-template'),
    ).to.throw(Error);
  });
});
