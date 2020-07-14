const { expect } = require('chai');

const validators = require('../../../../api/utils/validators');

function multiExpect(testFn, testCases, expectedVerb = 'equal') {
  // helper to run the same expectation on multiple cases of
  // inputs and expected results
  testCases.forEach((tc) => {
    const failureMsg = `Args "${tc.args}" did not result in "${tc.result}"`;

    if (expectedVerb === 'throw') {
      // need to wrap in an anonymous function for trapping thrown errors
      expect(() => testFn(...tc.args), failureMsg).to.throw(tc.result);
    } else {
      // otherwise, call directly
      expect(testFn(...tc.args), failureMsg).to[expectedVerb](tc.result);
    }
  });
}


describe('validators', () => {
  describe('.isValidYaml', () => {
    it('properly validates', () => {
      const goodYaml = [
        '---',
        'hi: james',
        'you_are:',
        '  - cool',
        '  - awesome',
      ].join('\n');

      const badYaml = [
        '---',
        'this_is_not_valid:',
        '-:boop',
      ].join('\n');

      const goodTestCases = [
        { args: [null], result: true },
        { args: [''], result: true },
        { args: ['one-line'], result: true },
        { args: [goodYaml], result: true },
      ];

      multiExpect(validators.isValidYaml, goodTestCases);

      const badTestCases = [
        { args: [': funky-line: boop'], result: 'input is not valid YAML' },
        { args: [badYaml], result: 'input is not valid YAML' },
      ];

      multiExpect(validators.isValidYaml, badTestCases, 'throw');
    });
  });

  describe('.isEmptyOrUrl', () => {
    it('should allow null', () => {
      expect(validators.isEmptyOrUrl(null)).to.be.undefined;
    });
    it('should allow empty string', () => {
      expect(validators.isEmptyOrUrl('')).to.be.undefined;
    });
    it('should allow url', () => {
      expect(validators.isEmptyOrUrl('https://hello.world')).to.be.undefined;
    });
    it('should not allow non url', () => {
      expect(() => validators.isEmptyOrUrl('hu')).to.throw(Error, 'URL must start with https://');
    });
  });

  describe('.validBasicAuthUsername', () => {
    it('accepts valid username', () => {
      expect(validators.validBasicAuthUsername('username1')).to.be.true;
    });

    it('accepts valid username with symbols that arenot semicolons', () => {
      expect(validators.validBasicAuthUsername('username1!@#$%^&*()-_+=<>?,./~`{}[]|\\')).to.be.true;
    });

    it('must contain at least 1 alphanumeric char', () => {
      expect(validators.validBasicAuthUsername('****')).to.be.false;
    });

    it('must be 4 characters', () => {
      expect(validators.validBasicAuthUsername('use')).to.be.false;
    });

    it('colons are not allowed in username', () => {
      expect(validators.validBasicAuthUsername('user:name1')).to.be.false;
    });
  });

  describe('.validBasicAuthPassword', () => {
    it('at least 1 uppercase, 1 lowercase and one number required', () => {
      expect(validators.validBasicAuthPassword('paSsw0rd')).to.be.true;
    });

    it('at least 1 uppercase, 1 lowercase and one number required w/ symbols', () => {
      expect(validators.validBasicAuthPassword('paSsw0rd!@#$%^&*()-_+=<>?,./~`{}[]|\\')).to.be.true;
    });

    it('at least 1 uppercase char required', () => {
      expect(validators.validBasicAuthPassword('passw0rd')).to.be.false;
    });

    it('at leaset 1 lowercase char required', () => {
      expect(validators.validBasicAuthPassword('PASSW0RD')).to.be.false;
    });

    it('at least one number required', () => {
      expect(validators.validBasicAuthPassword('paSsword')).to.be.false;
    });

    it('must be 4 characters', () => {
      expect(validators.validBasicAuthPassword('Pa5')).to.be.false;
    });
  });
});
