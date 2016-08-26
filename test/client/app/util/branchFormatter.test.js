import {expect} from 'chai';
import proxyquire from "proxyquire";

const encodeB64 = (str) => {
  return new Buffer(str).toString('base64');
}

describe('branchFormatter', () => {
  let fixture;

  beforeEach(() => {
    fixture = proxyquire('../../../../assets/app/util/branchFormatter', {
      './encoding': {
        encodeB64
      }
    })
  });

  it('formatDraftBranchName() should return a proerly formatted branch name', () => {
    const path = 'cool-file.md';
    const expected = '_draft-Y29vbC1maWxlLm1k';

    const actual = fixture.formatDraftBranchName(path);

    expect(actual).to.equal(expected);
  });

  it('pathHasDraft() should return true if there is a branch name that decodes to the path', () => {
    const path = 'cool-file.md';
    const drafts = [{ name: '_draft-Y29vbC1maWxlLm1k' }];
    const actual = fixture.pathHasDraft(path, drafts);

    expect(actual).to.equal(true);
  });

  it('pathHasDraft() should return false if there is not a branch name that decodes to the path', () => {
    const path = 'cool-file-two.md';
    const drafts = [{ name: '_draft-Y29vbC1maWxlLm1k' }];
    const actual = fixture.pathHasDraft(path, drafts);

    expect(actual).to.equal(false);
  });

});
