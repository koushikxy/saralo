import CryptoJS from 'crypto-js';

const PREFIX = 'LIFE_OS_AES256';
const ITERATIONS = 30000;

const deriveKeys = (password: string, salt: CryptoJS.lib.WordArray, iterations: number, split: boolean) => {
  const key = CryptoJS.PBKDF2(password, salt, { keySize: split ? 16 : 8, iterations, hasher: CryptoJS.algo.SHA256 });
  if (!split) return { encKey: key, macKey: key };
  return {
    encKey: CryptoJS.lib.WordArray.create(key.words.slice(0, 8), 32),
    macKey: CryptoJS.lib.WordArray.create(key.words.slice(8, 16), 32),
  };
};

export const encryptWithPassword = (data: unknown, password: string) => {
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const { encKey, macKey } = deriveKeys(password, salt, ITERATIONS, true);
  const cipher = CryptoJS.AES.encrypt(JSON.stringify(data), encKey, { iv }).ciphertext.toString(CryptoJS.enc.Base64);
  const body = ['v2', ITERATIONS, salt.toString(), iv.toString(), cipher].join('$');
  return `${PREFIX}$${body}$${CryptoJS.HmacSHA256(body, macKey).toString()}`;
};

export const decryptWithPassword = <T>(envelope: string, password: string): T => {
  const parts = envelope.trim().split('$');
  if (parts[0] !== PREFIX) throw new Error('Not a Saralo backup');

  const legacy = parts.length === 5;
  const [saltHex, ivHex, cipher, mac] = legacy ? parts.slice(1) : parts.slice(3);
  const iterations = legacy ? 5000 : Number(parts[2]);
  const { encKey, macKey } = deriveKeys(password, CryptoJS.enc.Hex.parse(saltHex), iterations, !legacy);
  const signed = legacy ? saltHex + ivHex + cipher : parts.slice(1, 6).join('$');
  if (CryptoJS.HmacSHA256(signed, macKey).toString() !== mac) throw new Error('Wrong password or damaged file');

  const plain = CryptoJS.AES.decrypt(
    CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(cipher) }),
    encKey,
    { iv: CryptoJS.enc.Hex.parse(ivHex) }
  ).toString(CryptoJS.enc.Utf8);
  return JSON.parse(plain);
};
