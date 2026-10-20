import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export const unlockWithDevice = async (reason: string) => {
  if (Platform.OS === 'web') return true;
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) return true;
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: reason });
  return result.success;
};
