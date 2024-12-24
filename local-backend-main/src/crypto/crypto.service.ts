import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'crypto';

@Injectable()
export class CryptoService {
  /**
   * Generates cryptographically strong salt.
   * @returns salt
   */
  getSalt(rounds: number = 10) {
    return bcrypt.genSalt(rounds);
  }

  /**
   * Hashes plaintext (for example for password)
   * @param plaintext plaintext to hash
   * @returns hash of the plaintext
   */
  async hash(plaintext: string) {
    const salt = await this.getSalt();
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Verifies if plaintext hash matches provided hash.
   * @param plaintext plaintext to verify with hash
   * @param hash hash to verify with plaintext
   * @returns does plaintext matches hash value
   */
  async verify(plaintext: string, hash: string) {
    return bcrypt.compare(plaintext, hash);
  }

  /**
   * Verifies message signature
   * @param input input to verify
   * @param signature signature to compare
   * @param publicKey public key to use
   * @returns if message has valid signature
   */
  verifySignature(input: string, signature: Buffer, publicKey: Buffer) {
    return verify(null, Buffer.from(input), publicKey, signature);
  }

  /**
   * Signs a message
   * @param input input string to sign
   * @param privateKey private key to use
   * @returns signature
   */
  createSignature(input: string, privateKey: string) {
    return sign(null, Buffer.from(input), privateKey);
  }

  /**
   * Generates random string from alphabet
   * @param length length of result string without prefix
   * @param alphabet string from which the characters are taken
   * @param prefix prefix for result
   * @returns generated string
   */
  makeUniqueString(length: number, alphabet: string, prefix?: string) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return `${prefix ?? ''}${result}`;
  }
}
