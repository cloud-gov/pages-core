import { expect } from 'chai';
import validators from '../../../frontend/util/validators';

describe('validBasicAuthUsername', () => {
  it('accepts valid username', () => {
    expect(validators.validBasicAuthUsername('username1')).to.be.undefined;
  });

  it('accepts valid username with symbols that arenot semicolons', () => {
    expect(validators.validBasicAuthUsername('username1!@#$%^&*()-_+=<>?,./~`{}[]|\\')).to.be.undefined;
  });

  it('must contain at least 1 alphanumeric char', () => {
    expect(validators.validBasicAuthUsername('****')).to.not.be.undefined;
  });

  it('must be 4 characters', () => {
    expect(validators.validBasicAuthUsername('use')).to.not.be.undefined;
  });

  it('colons are not allowed in username', () => {
    expect(validators.validBasicAuthUsername('user:name1')).to.not.be.undefined;
  });
});

describe('validBasicAuthPassword', () => {
  it('at least 1 uppercase, 1 lowercase and one number required', () => {
    expect(validators.validBasicAuthPassword('paSsw0rd')).to.be.undefined;
  });

  it('at least 1 uppercase, 1 lowercase and one number required w/ symbols', () => {
    expect(validators.validBasicAuthPassword('paSsw0rd!@#$%^&*()-_+=<>?,./~`{}[]|\\')).to.be.undefined;
  });

  it('at least 1 uppercase char required', () => {
    expect(validators.validBasicAuthPassword('passw0rd')).to.not.be.undefined;
  });

  it('at leaset 1 lowercase char required', () => {
    expect(validators.validBasicAuthPassword('PASSW0RD')).to.not.be.undefined;
  });

  it('at least one number required', () => {
    expect(validators.validBasicAuthPassword('paSsword')).to.not.be.undefined;
  });

  it('must be 4 characters', () => {
    expect(validators.validBasicAuthPassword('Pa5')).to.not.be.undefined;
  });
});
