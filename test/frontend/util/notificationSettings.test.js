import { expect } from 'chai';

import { notificationSettings } from '../../../frontend/util/notificationSettings';

describe('notificationSettings', () => {
  it('exports well-formed settings for the notifications middleware', () => {
    Object.keys(notificationSettings).forEach((key) => {
      const setting = notificationSettings[key];
      expect(setting).to.be.an('object').that.has.all.keys('type', 'params');
      expect(setting.params)
        .to.be.an('object')
        .that.has.all.keys('title', 'message', 'position', 'autoDismiss');
    });
  });
});
