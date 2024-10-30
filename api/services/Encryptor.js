const Crypto = require('crypto');
const _ = require('underscore');

const ALGORITHM = 'aes-256-gcm';

function encrypt(value, encryptionKey, { hintSize = 4 } = {}) {
  // Create a 32 byte hash from the secret key
  const hashedKey = Crypto.createHash('sha256').update(encryptionKey).digest();

  // Generate a random 16 byte initialization vector
  const iv = Crypto.randomBytes(16);

  // Create the cipher
  const cipher = Crypto.createCipheriv(ALGORITHM, hashedKey, iv);

  // Convert the value to a buffer
  const valueBuf = Buffer.from(value);

  // Encrypt the value
  const encrypted = Buffer.concat([cipher.update(valueBuf), cipher.final()]);

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  // Prepend the authentication tag and initialization vector to the encrypted buffer
  const ciphertext = [authTag, iv, encrypted]
    .map((buf) => buf.toString('hex')) // Convert all values to hex
    .join(':'); // Return a `:` delimited hex string

  // Create the hint
  const hint = hintSize ? value.slice(-1 * hintSize) : '';

  return { ciphertext, hint };
}

function encryptObjectValues(
  obj,
  encryptionKey,
  { hintSize = 4, onlyEncryptKeys = [] } = {},
) {
  const returnEncrypted = (item, shouldEncrypt = true) => {
    if (_.isString(item) && shouldEncrypt) {
      return encrypt(item, encryptionKey, { hintSize }).ciphertext;
    }

    if (_.isNumber(item) && shouldEncrypt) {
      return encrypt(item.toString(), encryptionKey, { hintSize }).ciphertext;
    }

    return item;
  };

  const encryptAll = onlyEncryptKeys.length === 0;

  return _.mapObject(obj, (value, key) => {
    const shouldEncrypt = encryptAll || onlyEncryptKeys.includes(key);

    if (_.isFunction(value)) {
      return value;
    }

    if (_.isArray(value) && shouldEncrypt) {
      return _.map(value, (item) => {
        if (_.isFunction(item)) {
          return item;
        }

        if (_.isObject(item)) {
          return encryptObjectValues(item, encryptionKey, {
            hintSize,
            onlyEncryptKeys,
          });
        }

        return returnEncrypted(item);
      });
    }

    if (_.isObject(value)) {
      return encryptObjectValues(value, encryptionKey, {
        hintSize,
        onlyEncryptKeys,
      });
    }

    return returnEncrypted(value, shouldEncrypt);
  });
}

function decrypt(ciphertext, encryptionKey) {
  const hashedKey = Crypto.createHash('sha256').update(encryptionKey).digest();
  const [authTagHex, ivHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = Crypto.createDecipheriv(ALGORITHM, hashedKey, iv);

  decipher.setAuthTag(authTag);

  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

module.exports = {
  ALGORITHM,
  encrypt,
  encryptObjectValues,
  decrypt,
};
