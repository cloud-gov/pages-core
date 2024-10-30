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

  describe('.encryptObjectValues', () => {
    it('should only encrypt string, numbers, and array values', () => {
      const key = 'encrypt-key';
      const data = {
        id: 123,
        name: 'this-is-a-data-object',
        numberlist: [1, 2, 3],
        stringList: ['a', 'b', 'c'],
        getFunction: () => {},
      };

      const output = Encryptor.encryptObjectValues(data, key);
      const decryptedId = Encryptor.decrypt(output.id, key);
      const decryptedName = Encryptor.decrypt(output.name, key);

      expect(decryptedId).to.equal(data.id.toString());
      expect(decryptedName).to.equal(data.name);
      output.numberlist.map((enc, idx) =>
        expect(Encryptor.decrypt(enc, key)).to.equal(data.numberlist[idx].toString()),
      );
      output.stringList.map((enc, idx) =>
        expect(Encryptor.decrypt(enc, key)).to.equal(data.stringList[idx]),
      );
      expect(typeof output.getFunction).to.equal('function');
    });

    it('should only encrypt key values when defined in options', () => {
      const key = 'encrypt-key';
      const id = 123;
      const name = 'this-test-object';
      const describe = 'The testing object';
      const secret = 'A secret to encrypt';
      const password = 'Apassword2encrypt';
      const pin = 8772274669;
      const onlyEncryptKeys = ['secret', 'password', 'pin'];
      const data = {
        id,
        name,
        describe,
        secret,
        password,
        pin,
      };

      const output = Encryptor.encryptObjectValues(data, key, {
        onlyEncryptKeys,
      });
      const decryptedSecret = Encryptor.decrypt(output.secret, key);
      const decryptedPassword = Encryptor.decrypt(output.password, key);
      const decryptedPin = Encryptor.decrypt(output.pin, key);

      expect(decryptedSecret).to.equal(secret);
      expect(decryptedPassword).to.equal(password);
      expect(decryptedPin).to.equal(pin.toString());
      expect(output.id).to.equal(id);
      expect(output.name).to.equal(name);
      expect(output.describe).to.equal(describe);
    });

    it('should only encrypt nested string, number, and array values', () => {
      const key = 'encrypt-key';
      const data = {
        id: 123,
        name: 'this-is-a-data-object',
        metadata: {
          name: 'The metadata',
          type: 'level 1',
          meta: {
            name: 'Meta metadata',
            list: [1, 2, 3],
          },
        },
        attributes: {
          total: 1,
        },
      };

      const output = Encryptor.encryptObjectValues(data, key);
      const decryptedId = Encryptor.decrypt(output.id, key);
      const decryptedName = Encryptor.decrypt(output.name, key);
      const decryptedMetadataName = Encryptor.decrypt(output.metadata.name, key);
      const decryptedMetadataType = Encryptor.decrypt(output.metadata.type, key);
      const decryptedMetadataMetaName = Encryptor.decrypt(output.metadata.meta.name, key);
      const decryptedAttributesTotal = Encryptor.decrypt(output.attributes.total, key);

      expect(decryptedId).to.equal(data.id.toString());
      expect(decryptedName).to.equal(data.name);
      expect(decryptedMetadataName).to.equal(data.metadata.name);
      expect(decryptedMetadataType).to.equal(data.metadata.type);
      expect(decryptedMetadataMetaName).to.equal(data.metadata.meta.name);
      output.metadata.meta.list.map((enc, idx) =>
        expect(Encryptor.decrypt(enc, key)).to.equal(
          data.metadata.meta.list[idx].toString(),
        ),
      );
      expect(decryptedAttributesTotal).to.equal(data.attributes.total.toString());
    });
  });
});
