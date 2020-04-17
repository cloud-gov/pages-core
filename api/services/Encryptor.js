const Crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function encrypt(value, key, { hintSize = 4 } = {}) {
  // Create a 32 byte hash from the secret key
  const hashedKey = Crypto.createHash('sha256').update(key).digest();

  // Generate a random 16 byte initialization vector
  const iv = Crypto.randomBytes(16);

  // Create the cipher
  const cipher = Crypto.createCipheriv(ALGORITHM, hashedKey, iv);

  // Ensure the value is utf8 encoded
  const utf8Value = Buffer.from(value).toString();

  // Encrypt the value
  const encrypted = cipher.update(utf8Value, 'utf8', 'hex') + cipher.final('hex');

  // Prepend the initialization vector to the encrypted text
  const ciphertext = `${iv.toString('hex')}:${encrypted}`;

  // Create the hint
  const hint = value.slice(-1 * hintSize);

  return { ciphertext, hint };
}

module.exports = { ALGORITHM, encrypt };
