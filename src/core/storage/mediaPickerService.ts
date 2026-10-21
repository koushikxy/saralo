import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { useVaultSession } from '../security/session';

const keep = (uri: string) => {
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true });
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const target = new File(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    new File(uri).copy(target);
    return target.uri;
  } catch (e) {
    console.warn('Could not save photo:', e);
    return uri;
  }
};

const pick = async (camera: boolean, aspect?: [number, number]) => {
  useVaultSession.getState().setPicking(true);
  try {
    const { status } = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(camera ? 'Camera access needed' : 'Photo access needed', `Allow ${camera ? 'camera' : 'photo'} access for Saralo in your phone settings.`);
      return null;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.8 };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    return !result.canceled && result.assets?.length ? keep(result.assets[0].uri) : null;
  } catch (e) {
    console.warn('Photo picker error:', e);
    return null;
  } finally {
    setTimeout(() => useVaultSession.getState().setPicking(false), 1500);
  }
};

export class MediaPickerService {
  static takePhoto = (aspect?: [number, number]) => pick(true, aspect);
  static pickFromGallery = (aspect?: [number, number]) => pick(false, aspect);
  static choose = (aspect?: [number, number]) =>
    new Promise<string | null>((done) =>
      Alert.alert('Add a photo', undefined, [
        { text: 'Camera', onPress: () => pick(true, aspect).then(done) },
        { text: 'Gallery', onPress: () => pick(false, aspect).then(done) },
        { text: 'Cancel', style: 'cancel', onPress: () => done(null) },
      ], { cancelable: true, onDismiss: () => done(null) })
    );
}
