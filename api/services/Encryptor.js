const Crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function encrypt(value, key, { hintSize = 4 } = {}) {
  // Create a 32 byte hash from the secret key
  const hashedKey = Crypto.createHash('sha256').update(key).digest();

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

  // Prepend the initialization vector to the encrypted text
  const ciphertext = [authTag, iv, encrypted]
    .map(buf => buf.toString('hex'))
    .join(':');

  // Create the hint
  const hint = value.slice(-1 * hintSize);

  return { ciphertext, hint };
}

module.exports = { ALGORITHM, encrypt };
