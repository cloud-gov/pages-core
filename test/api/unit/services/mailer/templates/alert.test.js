const { expect } = require('chai');
const alert = require('../../../../../../api/services/mailer/templates/alert');

describe('alert email template', () => {
  it('lists each error without separators between the items', () => {
    const html = alert({
      reason: 'something bad happened',
      errors: ['first error', 'second error'],
    });

    expect(html).to.contain('first error</li>');
    expect(html).to.contain('second error</li>');
    expect(html).to.not.match(/<\/li>\s*,/);
  });
});
