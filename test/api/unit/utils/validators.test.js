const expect = require('chai').expect;

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
  })

  describe('.validBasicAuthUsername', () => {
    it('only alphanumeric and hypehens allowed', () => {
      expect(validators.validBasicAuthUsername('hell0-_w0rld')).to.be.true;
    });

    it('non-alphanumeric and hypehens not allowed', () => {
      expect(validators.validBasicAuthUsername('hell0-_w0rld')).to.be.true;
    });

    it('must be 4 characters', () => {
      expect(validators.validBasicAuthUsername('hel')).to.be.false;
    });

    it('must be <= 15 characters', () => {
      expect(validators.validBasicAuthUsername('hell0-_world-_he')).to.be.false;
    });
  });
  describe('.validBasicAuthPassword', () => {
    it('only alphanumeric, hypehens and $!@ allowed', () => {
      expect(validators.validBasicAuthPassword('hell0-w0rld$!@')).to.be.true;
    });

    it('not allowed characters not in !@$', () => {
      expect(validators.validBasicAuthPassword('hell0-_w0rld&')).to.be.false;
    });

    it('must be 6 characters', () => {
      expect(validators.validBasicAuthPassword('hello')).to.be.false;
    });

    it('must be <= 25 characters', () => {
      expect(validators.validBasicAuthPassword('hell0-world-hello-hell0-wo')).to.be.false;
    });
  });
});
