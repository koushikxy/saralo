import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { Plus, CloudSun, Shirt, MapPin, RefreshCw } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, T, Button, Chips, Form, Field, Pick } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors } from '../core/theme';
import { confirmAction } from '../core/confirm';
import { MediaPickerService } from '../core/storage/mediaPickerService';
import { useStyleStore, GarmentCategory, OccasionType, WardrobeItem } from '../modules/style/styleStore';
import { generateCuratedOutfits } from '../modules/style/styleEngine';

const OCCASIONS: [OccasionType, string][] = [
  ['Everyday Casual', 'Everyday'],
  ['Work & Executive', 'Work'],
  ['Outing & Party', 'Party'],
  ['Date Night', 'Date'],
  ['Gym & Active', 'Gym'],
];
const CATEGORIES: [GarmentCategory, string, string, string][] = [
  ['Tops', 'Tops', '👕', 'top'],
  ['Bottoms', 'Bottoms', '👖', 'pants'],
  ['Shoes', 'Shoes', '👟', 'shoes'],
  ['Outerwear', 'Jackets', '🧥', 'jacket'],
  ['Accessories', 'Accessories', '⌚', 'watch'],
];
const COLORS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Denim', 'Beige', 'Brown', 'Olive', 'Green', 'Red', 'Pink', 'Yellow', 'Other'];

const Thumb: React.FC<{ item: WardrobeItem }> = ({ item }) => {
  const c = useColors();
  return item.imageUri ? (
    <Image source={{ uri: item.imageUri }} style={{ width: 44, height: 44, borderRadius: 12 }} />
  ) : (
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
      <T v="h2">{item.imageEmoji}</T>
    </View>
  );
};

export const OutfitsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { wardrobe, weather, selectedOccasion, setSelectedOccasion, logOutfitWorn, toggleCleanStatus, washAllLaundry, detectLocationAndWeather, deleteWardrobeItem } = useStyleStore();
  const [worn, setWorn] = useState<string | null>(null);
  const occ = OCCASIONS.find((o) => o[0] === selectedOccasion) ?? OCCASIONS[0];
  const outfits = generateCuratedOutfits(wardrobe, occ[0], weather.temperature);
  const laundry = wardrobe.filter((w) => !w.isClean);

  useEffect(() => {
    detectLocationAndWeather().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Outfits" onBack={() => navigation.goBack()} right={[{ icon: RefreshCw, label: 'Refresh weather', onPress: () => detectLocationAndWeather() }]} />
        <Row
          icon={CloudSun}
          iconColor="#F59E0B"
          title={`${Math.round(weather.temperature)}° · ${weather.condition}`}
          subtitle={`${weather.city} · ${weather.umbrellaAdvice}`}
          right={<MapPin size={18} color={c.textFaint} />}
          last
        />
        <Chips options={OCCASIONS.map((o) => o[1])} value={occ[1]} onChange={(v) => setSelectedOccasion(OCCASIONS.find((o) => o[1] === v)![0])} style={{ paddingVertical: 8 }} />

        <Section title="Ideas for today">
          {outfits.length === 0 ? (
            <Empty
              icon={Shirt}
              title={wardrobe.length === 0 ? 'Add your clothes' : 'Need a little more'}
              text={wardrobe.length === 0 ? 'Add a few tops, bottoms and shoes and we will suggest outfits for the weather.' : 'Add at least one clean top, bottom and pair of shoes.'}
              action={{ label: 'Add clothes', onPress: () => navigation.navigate('ClothForm') }}
            />
          ) : (
            outfits.map((o) => (
              <View key={o.id} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
                <T v="strong">{o.title}</T>
                <T v="sub" style={{ marginTop: 2 }}>
                  {o.stylingRule}
                </T>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[o.top, o.bottom, o.shoes, o.outerwear].filter(Boolean).map((p) => (
                    <Thumb key={p!.id} item={p!} />
                  ))}
                </View>
                {o.laundryWarning ? (
                  <T v="caption" color={c.warn} style={{ marginTop: 6 }}>
                    {o.laundryWarning}
                  </T>
                ) : null}
                <Button
                  title={worn === o.id ? 'Have a good day' : 'Wear this today'}
                  variant={worn === o.id ? 'secondary' : 'primary'}
                  style={{ marginTop: 10, height: 46 }}
                  onPress={() => {
                    logOutfitWorn([o.top.id, o.bottom.id, o.shoes.id, ...(o.outerwear ? [o.outerwear.id] : [])]);
                    setWorn(o.id);
                  }}
                />
              </View>
            ))
          )}
        </Section>

        {laundry.length > 0 ? (
          <Section title={`In the laundry (${laundry.length})`} action={{ label: 'All washed', onPress: washAllLaundry }}>
            {laundry.map((w, i) => (
              <Row key={w.id} leading={<Thumb item={w} />} title={w.name} subtitle="Tap when washed" onPress={() => toggleCleanStatus(w.id)} last={i === laundry.length - 1} />
            ))}
          </Section>
        ) : null}

        {CATEGORIES.map(([cat, label]) => {
          const items = wardrobe.filter((w) => w.category === cat);
          if (items.length === 0) return null;
          return (
            <Section key={cat} title={`${label} (${items.length})`}>
              {items.map((w, i) => (
                <Row
                  key={w.id}
                  leading={<Thumb item={w} />}
                  title={w.name}
                  subtitle={`${w.color} · worn ${w.wearCount} ${w.wearCount === 1 ? 'time' : 'times'}${w.isClean ? '' : ' · in laundry'}`}
                  onPress={() => toggleCleanStatus(w.id)}
                  onLongPress={() => confirmAction('Remove from closet?', w.name, 'Remove', () => deleteWardrobeItem(w.id))}
                  last={i === items.length - 1}
                />
              ))}
            </Section>
          );
        })}
        {wardrobe.length > 0 ? (
          <T v="caption" center style={{ marginTop: 12 }}>
            Tap an item to move it to or from the laundry. Long-press to remove.
          </T>
        ) : null}
      </Screen>
      <Fab label="Add clothes" icon={Plus} onPress={() => navigation.navigate('ClothForm')} />
    </View>
  );
};

export const ClothForm: React.FC<{ navigation: any }> = ({ navigation }) => {
  const addWardrobeItem = useStyleStore((s) => s.addWardrobeItem);
  const [cat, setCat] = useState('Tops');
  const [color, setColor] = useState('Black');
  const [occasions, setOccasions] = useState<string[]>(['Everyday']);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const c = useColors();

  const save = (again: boolean) => {
    const meta = CATEGORIES.find((x) => x[1] === cat)!;
    const finalName = name.trim() || `${color} ${meta[3]}`;
    addWardrobeItem({
      name: finalName.charAt(0).toUpperCase() + finalName.slice(1),
      category: meta[0],
      color,
      fabric: 'Cotton',
      tags: [meta[0], ...OCCASIONS.filter((o) => occasions.includes(o[1])).map((o) => o[0])],
      maxWearsBeforeWash: meta[0] === 'Shoes' || meta[0] === 'Accessories' ? 30 : meta[0] === 'Outerwear' ? 5 : 2,
      idealWeatherMin: meta[0] === 'Outerwear' ? 0 : 14,
      idealWeatherMax: meta[0] === 'Outerwear' ? 22 : 40,
      imageEmoji: meta[2],
      imageUri: photo ?? undefined,
    });
    if (again) {
      setName('');
      setPhoto(null);
    } else navigation.goBack();
  };

  return (
    <Form title="Add clothes" onCancel={() => navigation.goBack()} onSave={() => save(false)}>
      <Pick label="What is it?" options={CATEGORIES.map((x) => x[1])} value={cat} onChange={setCat} />
      <Pick label="Colour" options={COLORS} value={color} onChange={setColor} />
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8, paddingHorizontal: 16 }}>
          Wear it for (pick any)
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 }}>
          {OCCASIONS.map(([, label]) => {
            const on = occasions.includes(label);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setOccasions(on ? occasions.filter((o) => o !== label) : [...occasions, label])}
                style={{ paddingHorizontal: 16, height: 38, borderRadius: 19, justifyContent: 'center', backgroundColor: on ? c.accent : c.soft }}
              >
                <T v="sub" color={on ? '#FFFFFF' : c.ink} style={{ fontWeight: '600' }}>
                  {label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Field label="Name (optional)" value={name} onChangeText={setName} hint={`If empty we call it "${color} ${CATEGORIES.find((x) => x[1] === cat)![3]}"`} />
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        {photo ? <Image source={{ uri: photo }} style={{ width: 120, height: 120, borderRadius: 14, marginBottom: 10 }} /> : null}
        <Button title={photo ? 'Change photo' : 'Add a photo (optional)'} variant="secondary" onPress={async () => {
          const u = await MediaPickerService.pickFromGallery();
          if (u) setPhoto(u);
        }} />
      </View>
      <Button title="Save and add another" variant="secondary" style={{ marginHorizontal: 16 }} onPress={() => save(true)} />
    </Form>
  );
};
