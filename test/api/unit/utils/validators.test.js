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
      const goodYaml = ['---', 'hi: james', 'you_are:', '  - cool', '  - awesome'].join(
        '\n',
      );

      const badYaml = ['---', 'this_is_not_valid:', '-:boop'].join('\n');

      const goodTestCases = [
        {
          args: [null],
          result: true,
        },
        {
          args: [''],
          result: true,
        },
        {
          args: ['one-line'],
          result: true,
        },
        {
          args: [goodYaml],
          result: true,
        },
      ];

      multiExpect(validators.isValidYaml, goodTestCases);

      const badTestCases = [
        {
          args: [': funky-line: boop'],
          result: 'input is not valid YAML',
        },
        {
          args: [badYaml],
          result: 'input is not valid YAML',
        },
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
      expect(() => validators.isEmptyOrUrl('hu')).to.throw(
        Error,
        'URL must start with https://',
      );
    });
  });

  describe('.isValidBranchName', () => {
    // https://git-scm.com/docs/git-check-ref-format
    // Git imposes the following rules on how references are named:
    //
    // 1. They can include slash / for hierarchical (directory) grouping,
    // but no slash-separated component can begin with a dot . or end with the sequence .lock.
    //
    // 2. They must contain at least one /. This enforces the presence of a category like heads/, tags/ etc.
    // but the actual names are not restricted. If the --allow-onelevel option is used, this rule is waived.
    //
    // 3. They cannot have two consecutive dots .. anywhere.
    //
    // 4. They cannot have ASCII control characters (i.e. bytes whose values are lower than \040, or \177 DEL),
    // space, tilde ~, caret ^, or colon : anywhere.
    //
    // 5. They cannot have question-mark ?, asterisk *, or open bracket [ anywhere.
    // (--refspec-pattern option is an exception to this rule).
    //
    // 6. They cannot begin or end with a slash / or contain multiple consecutive slashes
    // (--normalize option is an exception to this rule).
    //
    // 7. They cannot end with a dot ..
    //
    // 8. They cannot contain a sequence @{.
    //
    // 9. They cannot be the single character @.
    //
    // 10. They cannot contain a \.

    const specialChars = [
      // Control characters (0x00-0x1F) - ALL forbidden
      { specialChar: '\x00', allowed: false }, // NUL
      { specialChar: '\x01', allowed: false }, // SOH
      { specialChar: '\x02', allowed: false }, // STX
      { specialChar: '\x03', allowed: false }, // ETX
      { specialChar: '\x04', allowed: false }, // EOT
      { specialChar: '\x05', allowed: false }, // ENQ
      { specialChar: '\x06', allowed: false }, // ACK
      { specialChar: '\x07', allowed: false }, // BEL
      { specialChar: '\x08', allowed: false }, // BS
      { specialChar: '\x09', allowed: false }, // TAB
      { specialChar: '\x0A', allowed: false }, // LF
      { specialChar: '\x0B', allowed: false }, // VT
      { specialChar: '\x0C', allowed: false }, // FF
      { specialChar: '\x0D', allowed: false }, // CR
      { specialChar: '\x0E', allowed: false }, // SO
      { specialChar: '\x0F', allowed: false }, // SI
      { specialChar: '\x10', allowed: false }, // DLE
      { specialChar: '\x11', allowed: false }, // DC1
      { specialChar: '\x12', allowed: false }, // DC2
      { specialChar: '\x13', allowed: false }, // DC3
      { specialChar: '\x14', allowed: false }, // DC4
      { specialChar: '\x15', allowed: false }, // NAK
      { specialChar: '\x16', allowed: false }, // SYN
      { specialChar: '\x17', allowed: false }, // ETB
      { specialChar: '\x18', allowed: false }, // CAN
      { specialChar: '\x19', allowed: false }, // EM
      { specialChar: '\x1A', allowed: false }, // SUB
      { specialChar: '\x1B', allowed: false }, // ESC
      { specialChar: '\x1C', allowed: false }, // FS
      { specialChar: '\x1D', allowed: false }, // GS
      { specialChar: '\x1E', allowed: false }, // RS
      { specialChar: '\x1F', allowed: false }, // US

      // Printable special characters
      { specialChar: ' ', allowed: false }, // Space - forbidden
      { specialChar: '!', allowed: true },
      { specialChar: '"', allowed: true },
      { specialChar: '#', allowed: true },
      { specialChar: '$', allowed: true },
      { specialChar: '%', allowed: true },
      { specialChar: '&', allowed: true },
      { specialChar: "'", allowed: true },
      { specialChar: '(', allowed: true },
      { specialChar: ')', allowed: true },
      { specialChar: '*', allowed: false }, // Asterisk - forbidden
      { specialChar: '+', allowed: true },
      { specialChar: ',', allowed: true },
      { specialChar: '-', allowed: true },
      { specialChar: '.', allowed: true }, // Allowed but with restrictions
      { specialChar: '/', allowed: true }, // Allowed but with restrictions
      { specialChar: ':', allowed: false }, // Colon - forbidden
      { specialChar: ';', allowed: true },
      { specialChar: '<', allowed: true },
      { specialChar: '=', allowed: true },
      { specialChar: '>', allowed: true },
      { specialChar: '?', allowed: false }, // Question mark - forbidden
      { specialChar: '@', allowed: true }, // Allowed but '@{' sequence forbidden
      { specialChar: '[', allowed: false }, // Open bracket - forbidden
      { specialChar: '\\', allowed: false }, // Backslash - forbidden
      { specialChar: ']', allowed: true },
      { specialChar: '^', allowed: false }, // Caret - forbidden
      { specialChar: '_', allowed: true },
      { specialChar: '`', allowed: true },
      { specialChar: '{', allowed: true }, // Allowed but '@{' sequence forbidden
      { specialChar: '|', allowed: true },
      { specialChar: '}', allowed: true },
      { specialChar: '~', allowed: false }, // Tilde - forbidden

      // DEL control character
      { specialChar: '\x7F', allowed: false }, // DEL
    ];

    it("validates Git reference names according to Git's rules", () => {
      expect(validators.isValidBranchName('feature/my-branch')).to.equal(true);
      expect(validators.isValidBranchName('hotfix/bug-123')).to.equal(true);
      expect(validators.isValidBranchName('/invalid')).to.equal(false);
      expect(validators.isValidBranchName('bad..name')).to.equal(false);
      expect(validators.isValidBranchName('branch with spaces')).to.equal(false);
      expect(validators.isValidBranchName('main')).to.equal(true);
      expect(validators.isValidBranchName('refs/tags/v1.0.0')).to.equal(true);
      expect(validators.isValidBranchName('main')).to.equal(true);
      expect(validators.isValidBranchName('.hidden')).to.equal(false);
      expect(validators.isValidBranchName('branch.lock')).to.equal(false);
      expect(validators.isValidBranchName('bad..name')).to.equal(false);
      expect(validators.isValidBranchName('bad@{name}')).to.equal(false);
      expect(validators.isValidBranchName('bad\\name')).to.equal(false);
      expect(validators.isValidBranchName('/main')).to.equal(false);
      expect(validators.isValidBranchName('main/')).to.equal(false);
      expect(validators.isValidBranchName('ma//in')).to.equal(false);
      expect(validators.isValidBranchName('main.')).to.equal(false);
      expect(validators.isValidBranchName('@{')).to.equal(false);

      specialChars.forEach((i) => {
        expect(
          validators.isValidBranchName(`branch${i.specialChar}branch`),
          i.specialChar,
        ).to.equal(i.allowed);
      });
    });
  });
});
