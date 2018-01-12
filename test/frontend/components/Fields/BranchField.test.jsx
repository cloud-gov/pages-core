import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import BranchField, { validateBranchName } from '../../../../frontend/components/Fields/BranchField';

describe('<BranchField />', () => {
  it.only('validates', () => {
    const msg = 'Branch name contains invalid characters.';

    expect(validateBranchName()).to.be.undefined;
    expect(validateBranchName('')).to.be.undefined;
    expect(validateBranchName('branch')).to.be.undefined;
    expect(validateBranchName('branch/1')).to.be.undefined;
    //expect(validateBranchName('branch_test')).to.be.undefined;
    //expect(validateBranchName('branch-test')).to.be.undefined;
    //expect(validateBranchName('branch.test')).to.be.undefined;

    // expect(validateBranchName('.')).to.equal(msg);
    // expect(validateBranchName('/')).to.equal(msg);
    // expect(validateBranchName('branch..')).to.equal(msg);
    // expect(validateBranchName('branch/test//bad')).to.equal(msg);
    // expect(validateBranchName('branch..bad')).to.equal(msg);
    //expect(validateBranchName('@')).to.equal(msg);
    //expect(validateBranchName('bad@{')).to.equal(msg);
    //expect(validateBranchName('@{bad')).to.equal(msg);
    //expect(validateBranchName('bad/')).to.equal(msg);
    //expect(validateBranchName('bad.lock')).to.equal(msg);
    //expect(validateBranchName('bad.')).to.equal(msg);
  });
});
