const { expect } = require('chai');
const Encryptor = require('../../../../api/services/Encryptor');

describe('Encryptor', () => {
  describe('.encrypt', () => {
    const value = 'hello world';
    const key = 'shhhhhhh';

    it('encrypts the value', () => {
      const { ciphertext } = Encryptor.encrypt(value, key);
      const decrypted = Encryptor.decrypt(ciphertext, key);

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

    it('returns an empty string when specified size is 0', () => {
      const hintSize = 0;

      const { hint } = Encryptor.encrypt(value, key, { hintSize });

      expect(hint).to.eq('');
    });
  });
});
