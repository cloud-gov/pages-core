import { expect } from 'chai';

import { validateBranchName } from '../../../../frontend/components/Fields/BranchField';

describe('<BranchField />', () => {
  it('validates', () => {
    const msg = 'Branch name contains invalid characters.';

    expect(validateBranchName('branch')).to.be.undefined;
    expect(validateBranchName('branch_test')).to.be.undefined;
    expect(validateBranchName('branch-test')).to.be.undefined;
    expect(validateBranchName('branch/test')).to.be.undefined;

    expect(validateBranchName('/')).to.equal(msg);
    expect(validateBranchName('branch\\bad')).to.equal(msg);
    expect(validateBranchName('/branch-test')).to.equal(msg);
    expect(validateBranchName('branch-test/')).to.equal(msg);
    expect(validateBranchName('-branch-test')).to.equal(msg);
    expect(validateBranchName('branch-test-')).to.equal(msg);
    expect(validateBranchName('@')).to.equal(msg);
    expect(validateBranchName('bad/')).to.equal(msg);
  });
});
