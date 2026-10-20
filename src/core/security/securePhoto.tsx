import React, { useEffect, useState } from 'react';
import { Image, ImageProps, Platform, View } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import { AESSealedData, aesEncryptAsync, aesDecryptAsync } from 'expo-crypto';
import { getKey } from '../storage/persistStorage';

const PREFIX = 'enc:';

export const sealPhoto = async (uri: string) => {
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'vault');
    if (!dir.exists) dir.create({ intermediates: true });
    const source = new File(uri);
    const sealed = await aesEncryptAsync(await source.bytes(), await getKey());
    const target = new File(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.bin`);
    target.write(await sealed.combined());
    if (source.uri.startsWith(Paths.document.uri) || source.uri.startsWith(Paths.cache.uri)) source.delete();
    return PREFIX + target.uri;
  } catch (e) {
    console.warn('Could not lock photo:', e);
    return uri;
  }
};

export const openPhoto = async (stored: string) => {
  if (!stored.startsWith(PREFIX)) return stored;
  const bytes = await new File(stored.slice(PREFIX.length)).bytes();
  const b64 = await aesDecryptAsync(AESSealedData.fromCombined(bytes), await getKey(), { output: 'base64' });
  return `data:image/jpeg;base64,${b64}`;
};

export const deletePhoto = (stored?: string | null) => {
  if (!stored?.startsWith(PREFIX)) return;
  try {
    new File(stored.slice(PREFIX.length)).delete();
  } catch {}
};

export const SecureImage: React.FC<Omit<ImageProps, 'source'> & { uri: string }> = ({ uri, style, ...rest }) => {
  const [src, setSrc] = useState<string | null>(uri.startsWith(PREFIX) ? null : uri);
  useEffect(() => {
    let live = true;
    openPhoto(uri)
      .then((s) => live && setSrc(s))
      .catch(() => live && setSrc(null));
    return () => {
      live = false;
    };
  }, [uri]);
  return src ? <Image source={{ uri: src }} style={style} {...rest} /> : <View style={style} />;
};
