import { expect } from 'chai';

import {
  getSafeRepoName, groupLogs, sandboxOrgMsg, sandboxSiteMsg
} from '../../../frontend/util';

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

describe('groupLogs', () => {
  it('groups the logs by source', () => {
    const logs = [
      { source: 'source1', output: 'hello' },
      { source: 'source2', output: 'foo' },
      { source: 'source1', output: 'world' },
      { source: 'source2', output: 'bar' },
    ];

    expect(groupLogs(logs)).to.deep.equal({
      source1: ['hello', 'world'],
      source2: ['foo', 'bar'],
    });
  });
});

describe('sandboxOrgMsg', () => {
  it('not 1 day', () => {
    expect(sandboxOrgMsg(2)).to.equal('All data for this sandbox organization will be removed in 2 days.');
  });
  it('1 day', () => {
    expect(sandboxOrgMsg(1)).to.equal('All data for this sandbox organization will be removed in 1 day.');
  });
});

describe('sandboxSiteMsg', () => {
  it('not 1 day', () => {
    expect(sandboxSiteMsg(2)).to.equal('All data for this sandbox organization site will be removed in 2 days.');
  });
  it('1 day', () => {
    expect(sandboxSiteMsg(1)).to.equal('All data for this sandbox organization site will be removed in 1 day.');
  });
});
