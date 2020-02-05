import { expect } from 'chai';

import { getSafeRepoName } from '../../../frontend/util';

describe('getSafeRepoName', () => {
  it('returns safe repo names', () => {
    expect(getSafeRepoName('----precedinghypensrepo')).to.equal('precedinghypensrepo');
    expect(getSafeRepoName('trailinghypenrepo---')).to.equal('trailinghypenrepo');
    expect(getSafeRepoName('-holycow-')).to.equal('holycow');
    expect(getSafeRepoName('cleans    spaces')).to.equal('cleans-spaces');
    expect(getSafeRepoName('#cleans@@weird**characters!')).to.equal('cleans-weird-characters');
    expect(getSafeRepoName('periods.are.ok')).to.equal('periods.are.ok');
  });
});
