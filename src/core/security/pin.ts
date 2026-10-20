import * as Crypto from 'expo-crypto';
import { useProfileStore } from '../../modules/profile/profileStore';

const digest = (salt: string, pin: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `saralo:${salt}:${pin}`);

export const hashPin = async (pin: string) => {
  const salt = Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
  return `h1$${salt}$${await digest(salt, pin)}`;
};

export const pinMatches = async (pin: string, stored: string) => {
  if (!stored.startsWith('h1$')) return pin === stored;
  const [, salt, hash] = stored.split('$');
  return (await digest(salt, pin)) === hash;
};

export const lockSecondsLeft = () => Math.max(0, Math.ceil((useProfileStore.getState().pinLockedUntil - Date.now()) / 1000));

export const checkPin = async (pin: string) => {
  const s = useProfileStore.getState();
  if (lockSecondsLeft() > 0) return false;
  if (await pinMatches(pin, s.vaultPin)) {
    if (!s.vaultPin.startsWith('h1$')) s.setVaultPin(await hashPin(pin));
    s.setPinFails(0, 0);
    return true;
  }
  const fails = s.pinFails + 1;
  const wait = fails < 5 ? 0 : Math.min(15 * 60, 30 * 2 ** (fails - 5));
  s.setPinFails(fails, wait ? Date.now() + wait * 1000 : 0);
  return false;
};
