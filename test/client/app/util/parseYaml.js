import { parseYaml, writeYaml } from '../../../../assets/app/util/parseYaml';
import { expect } from 'chai';

describe('parseYaml()', () => {
  it('returns an empty object when given invalid yaml', () => {
    expect(parseYaml(null)).to.eql({});
    expect(parseYaml(undefined)).to.eql({});
    expect(parseYaml({})).to.eql({});
    expect(parseYaml(1)).to.eql({});
    expect(parseYaml('')).to.eql({});
  });

  it('returns an object of key value pairs given a yaml string', () => {
    const yaml = '#This is a comment, and will not be parsed\ncat: dog\nleft: right';
    const obj = parseYaml(yaml);
    expect(obj).to.contain.all.keys(['cat', 'left']);
  });
});

describe('writeYaml', () => {
  it('returns yaml given some value', () => {
    [null, 1, {test: 'obj'}].forEach((testValue) => {
      expect(typeof writeYaml(testValue)).to.equal('string');
    });
  });
});
