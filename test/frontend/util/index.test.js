import { expect } from 'chai';

import {
  getOrgId, getSafeRepoName, groupLogs,
} from '../../../frontend/util';

describe('getOrgId', () => {
  it('should return the id if it is defined', () => {
    const id = 1;
    const orgs = [{ id: 2 }, { id: 3 }];

    expect(getOrgId(id, orgs)).to.equal(id);
  });

  it('should return the first org id from the array of orgs if id is undefined', () => {
    const id = undefined;
    const orgs = [{ id: 2 }, { id: 3 }];

    expect(getOrgId(id, orgs)).to.equal(orgs[0].id);
  });

  it('should return null if org and id are undefined', () => {
    const id = undefined;
    const orgs = undefined;

    expect(getOrgId(id, orgs)).to.be.null;
  });
});

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
