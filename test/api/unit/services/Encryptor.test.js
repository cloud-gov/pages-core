const { expect } = require('chai');
const Crypto = require('crypto');
const Encryptor = require('../../../../api/services/Encryptor');

function decrypt(ciphertext, key) {
  const hashedKey = Crypto.createHash('sha256').update(key).digest();
  const [authTagHex, ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = Crypto.createDecipheriv(Encryptor.ALGORITHM, hashedKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  return decrypted;
}

describe('Encryptor', () => {
  describe('.encrypt', () => {
    const value = 'hello world';
    const key = 'shhhhhhh';

    it('encrypts the value', () => {
      const { ciphertext } = Encryptor.encrypt(value, key);
      const decrypted = decrypt(ciphertext, key);

      expect(decrypted).to.eq(value);
    });

    it('returns a hint with the default size of 4', () => {
      const { hint } = Encryptor.encrypt(value, key);

      expect(hint.length).to.eq(4);
    });

    it('returns a hint with the specified size', () => {
      const hintSize = 5;

      const { hint } = Encryptor.encrypt(value, key, { hintSize });

      expect(hint.length).to.eq(hintSize);
    });
  });
});
