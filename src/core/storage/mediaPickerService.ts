import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { Alert, Platform } from 'react-native';

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

const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 0.8 };

const pick = async (camera: boolean) => {
  try {
    const { status } = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(camera ? 'Camera access needed' : 'Photo access needed', `Allow ${camera ? 'camera' : 'photo'} access for Saralo in your phone settings.`);
      return null;
    }
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    return !result.canceled && result.assets?.length ? keep(result.assets[0].uri) : null;
  } catch (e) {
    console.warn('Photo picker error:', e);
    return null;
  }
};

export class MediaPickerService {
  static takePhoto = () => pick(true);
  static pickFromGallery = () => pick(false);
}
