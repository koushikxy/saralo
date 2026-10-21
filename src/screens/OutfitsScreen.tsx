import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View, Image } from 'react-native';
import { Plus, Shirt, RefreshCw, Shuffle, X, Camera, ImageIcon, Pencil, Trash2, Sparkles, WashingMachine } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, T, Button, Form, Field, Pick, Segmented } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors } from '../core/theme';
import { localDate } from '../core/date';
import { confirmAction } from '../core/confirm';
import { MediaPickerService } from '../core/storage/mediaPickerService';
import { useStyleStore, GarmentCategory, OccasionType, WardrobeItem } from '../modules/style/styleStore';
import { useProfileStore } from '../modules/profile/profileStore';
import { generateCuratedOutfits, CuratedOutfit, COLORS, COLOR_SWATCH } from '../modules/style/styleEngine';
import { rupees } from './money/moneyMeta';

const OCCASIONS: [OccasionType, string][] = [
  ['Everyday Casual', 'Everyday'],
  ['Work & Executive', 'Work'],
  ['Outing & Party', 'Party'],
  ['Date Night', 'Date'],
  ['Festival & Wedding', 'Festival'],
  ['Gym & Active', 'Gym'],
];
const CATEGORIES: [GarmentCategory, string, string, string][] = [
  ['Tops', 'Top', '👕', 'top'],
  ['Bottoms', 'Bottom', '👖', 'bottom'],
  ['One-piece', 'Kurta, saree, dress', '👗', 'outfit'],
  ['Shoes', 'Shoes', '👟', 'shoes'],
  ['Outerwear', 'Jacket', '🧥', 'jacket'],
  ['Accessories', 'Accessory', '⌚', 'accessory'],
];
const SECTION_NAMES: Record<GarmentCategory, string> = { Tops: 'Tops', Bottoms: 'Bottoms', 'One-piece': 'Kurtas, sarees and dresses', Shoes: 'Shoes', Outerwear: 'Jackets', Accessories: 'Accessories' };

const daysAgo = (day?: string) => (day ? Math.round((new Date(`${localDate()}T00:00:00`).getTime() - new Date(`${day}T00:00:00`).getTime()) / 86400000) : null);
const wornText = (w: WardrobeItem) => {
  const n = w.timesWorn ?? 0;
  const d = daysAgo(w.lastWorn);
  return `${n === 0 ? 'Not worn yet' : `Worn ${n} ${n === 1 ? 'time' : 'times'}`}${d === null ? '' : d === 0 ? ' · today' : d === 1 ? ' · yesterday' : ` · ${d} days ago`}`;
};

const Thumb: React.FC<{ item: WardrobeItem; size?: number }> = ({ item, size = 44 }) => {
  const c = useColors();
  return item.imageUri ? (
    <Image source={{ uri: item.imageUri }} style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: c.soft }} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
      <T v="h2" style={{ fontSize: size * 0.45 }}>
        {item.imageEmoji}
      </T>
      <View style={{ position: 'absolute', right: 5, bottom: 5, width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: COLOR_SWATCH[item.color] ?? '#999', borderWidth: 1, borderColor: c.line }} />
    </View>
  );
};

const OutfitCard: React.FC<{ o: CuratedOutfit; worn: boolean; onWear: () => void; onOpen: (id: string) => void }> = ({ o, worn, onWear, onOpen }) => {
  const c = useColors();
  const pieces = [o.top, o.bottom, o.onePiece, o.shoes, o.outerwear].filter(Boolean) as WardrobeItem[];
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 24, backgroundColor: c.card, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <T v="caption" color={c.accent} style={{ flex: 1, fontWeight: '800', letterSpacing: 0.4 }}>
          {o.vibe.toUpperCase()}
        </T>
        <T v="caption" style={{ fontWeight: '700' }}>
          {o.harmonyScore}% match
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {pieces.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => onOpen(p.id)} style={{ flex: 1, alignItems: 'center' }} accessibilityLabel={p.name}>
            <Thumb item={p} size={Math.min(96, 300 / pieces.length)} />
            <T v="caption" center lines={1} style={{ marginTop: 6 }}>
              {p.name}
            </T>
          </TouchableOpacity>
        ))}
      </View>
      <T v="strong" style={{ marginTop: 12 }}>
        {o.title}
      </T>
      <T v="sub" style={{ marginTop: 2 }}>
        {o.stylingRule}
      </T>
      {o.laundryWarning ? (
        <T v="caption" color={c.warn} style={{ marginTop: 6, fontWeight: '600' }}>
          {o.laundryWarning}
        </T>
      ) : null}
      <Button title={worn ? 'Wearing this today ✓ · tap to undo' : 'Wear this today'} variant={worn ? 'secondary' : 'primary'} style={{ marginTop: 12, height: 46 }} onPress={onWear} />
    </View>
  );
};

export const OutfitsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const { wardrobe, weather, selectedOccasion, setSelectedOccasion, logOutfitWorn, washAllLaundry, detectLocationAndWeather, toggleCleanStatus, wornLog } = useStyleStore(
    useShallow(({ wardrobe, weather, selectedOccasion, setSelectedOccasion, logOutfitWorn, washAllLaundry, detectLocationAndWeather, toggleCleanStatus, wornLog }) => ({ wardrobe, weather, selectedOccasion, setSelectedOccasion, logOutfitWorn, washAllLaundry, detectLocationAndWeather, toggleCleanStatus, wornLog }))
  );
  const [round, setRound] = useState(0);
  const [pinId, setPinId] = useState<string | undefined>(route.params?.pin);
  const occ = OCCASIONS.find((o) => o[0] === selectedOccasion) ?? OCCASIONS[0];
  const outfits = generateCuratedOutfits(wardrobe, occ[0], weather.temperature, { pinId, rainy: weather.needsUmbrella, round });
  const laundry = wardrobe.filter((w) => !w.isClean);
  const todayLog = wornLog.find((w) => w.day === localDate());
  const pinned = wardrobe.find((w) => w.id === pinId);
  const unworn = wardrobe.filter((w) => w.category !== 'Accessories' && (daysAgo(w.lastWorn) ?? 99) >= 30);

  useEffect(() => {
    detectLocationAndWeather().catch(() => {});
  }, []);

  useEffect(() => {
    if (route.params?.pin) {
      setPinId(route.params.pin);
      setRound(0);
      navigation.setParams({ pin: undefined });
    }
  }, [route.params?.pin]);

  const wear = (o: CuratedOutfit) => logOutfitWorn([o.top, o.bottom, o.onePiece, o.shoes, o.outerwear].filter(Boolean).map((p) => p!.id));
  const isWorn = (o: CuratedOutfit) => !!todayLog && [o.top, o.bottom, o.onePiece, o.shoes].filter(Boolean).every((p) => todayLog.items.includes(p!.id));

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Outfits" onBack={() => navigation.goBack()} right={[{ icon: RefreshCw, label: 'Refresh weather', onPress: () => detectLocationAndWeather() }]} />
        <T v="sub" style={{ paddingHorizontal: 16, marginTop: -4, marginBottom: 12 }}>
          {Math.round(weather.temperature)}° {weather.condition.toLowerCase()} in {weather.city.split(',')[0]}
          {weather.needsUmbrella ? ' · take an umbrella' : ''}
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 }}>
          {OCCASIONS.map(([value, label]) => {
            const on = value === occ[0];
            return (
              <TouchableOpacity
                key={value}
                onPress={() => {
                  setSelectedOccasion(value);
                  setRound(0);
                }}
                style={{ paddingHorizontal: 16, height: 38, borderRadius: 19, justifyContent: 'center', backgroundColor: on ? c.accent : c.raised, borderWidth: 1, borderColor: on ? c.accent : c.line }}
              >
                <T v="sub" color={on ? '#FFFFFF' : c.ink} style={{ fontWeight: '600' }}>
                  {label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>

        {pinned ? (
          <View style={{ marginHorizontal: 16, marginTop: 14, padding: 12, borderRadius: 18, backgroundColor: c.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Thumb item={pinned} size={40} />
            <T v="sub" color={c.ink} style={{ flex: 1, fontWeight: '600' }}>
              Outfits built around {pinned.name.toLowerCase()}
            </T>
            <TouchableOpacity onPress={() => setPinId(undefined)} accessibilityLabel="Stop styling this item" style={{ padding: 6 }}>
              <X size={20} color={c.ink} />
            </TouchableOpacity>
          </View>
        ) : null}

        {todayLog ? (
          <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 22, backgroundColor: c.incomeSoft }}>
            <T v="caption" color={c.income} style={{ fontWeight: '800', letterSpacing: 0.4 }}>
              TODAY'S OUTFIT
            </T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {todayLog.items
                .map((id) => wardrobe.find((w) => w.id === id))
                .filter((w): w is WardrobeItem => !!w)
                .map((w) => (
                  <TouchableOpacity key={w.id} onPress={() => navigation.navigate('ClothItem', { id: w.id })} accessibilityLabel={w.name}>
                    <Thumb item={w} size={56} />
                  </TouchableOpacity>
                ))}
            </View>
            <T v="caption" style={{ marginTop: 8 }}>
              Changed your mind? Tap Wear this today on another idea.
            </T>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, marginTop: 20, marginBottom: 8 }}>
          <T v="section" style={{ flex: 1 }}>
            Ideas for today
          </T>
          {outfits.length ? (
            <TouchableOpacity onPress={() => setRound(round + 1)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 }} accessibilityLabel="Show other ideas">
              <Shuffle size={16} color={c.accent} />
              <T v="sub" color={c.accent} style={{ fontWeight: '700' }}>
                Shuffle
              </T>
            </TouchableOpacity>
          ) : null}
        </View>
        {outfits.length === 0 ? (
          <Empty
            icon={Shirt}
            title={wardrobe.length === 0 ? 'Add your clothes' : 'Need a little more'}
            text={wardrobe.length === 0 ? 'Add a few tops, bottoms or kurtas and a pair of shoes. We suggest outfits for the weather and the occasion.' : 'Add at least one pair of shoes and a top with a bottom, or a kurta, saree or dress.'}
            action={{ label: 'Add clothes', onPress: () => navigation.navigate('ClothForm') }}
          />
        ) : (
          outfits.map((o) => <OutfitCard key={o.id} o={o} worn={isWorn(o)} onWear={() => (isWorn(o) ? logOutfitWorn([]) : wear(o))} onOpen={(id) => navigation.navigate('ClothItem', { id })} />)
        )}

        {laundry.length > 0 ? (
          <Section title={`In the laundry (${laundry.length})`} action={{ label: 'All washed', onPress: washAllLaundry }}>
            {laundry.map((w, i) => (
              <Row key={w.id} leading={<Thumb item={w} />} title={w.name} subtitle="Tap when it is washed" onPress={() => toggleCleanStatus(w.id)} last={i === laundry.length - 1} />
            ))}
          </Section>
        ) : null}

        {unworn.length > 0 && wardrobe.length >= 5 ? (
          <Section title="Not worn in a month">
            {unworn.slice(0, 4).map((w, i, list) => (
              <Row key={w.id} leading={<Thumb item={w} />} title={w.name} subtitle="Tap to see outfits with it" chevron onPress={() => { setPinId(w.id); setRound(0); }} last={i === list.length - 1} />
            ))}
          </Section>
        ) : null}

        {CATEGORIES.map(([cat]) => {
          const items = wardrobe.filter((w) => w.category === cat);
          if (items.length === 0) return null;
          return (
            <Section key={cat} title={`${SECTION_NAMES[cat]} (${items.length})`}>
              {items.map((w, i) => (
                <Row key={w.id} leading={<Thumb item={w} />} title={w.name} subtitle={`${w.color} · ${wornText(w)}${w.isClean ? '' : ' · in laundry'}`} chevron onPress={() => navigation.navigate('ClothItem', { id: w.id })} last={i === items.length - 1} />
              ))}
            </Section>
          );
        })}
      </Screen>
      <Fab label="Add clothes" icon={Plus} onPress={() => navigation.navigate('ClothForm')} />
    </View>
  );
};

export const ClothItemScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const { wardrobe, toggleCleanStatus, deleteWardrobeItem } = useStyleStore(useShallow(({ wardrobe, toggleCleanStatus, deleteWardrobeItem }) => ({ wardrobe, toggleCleanStatus, deleteWardrobeItem })));
  const item = wardrobe.find((w) => w.id === route.params?.id);
  if (!item) return null;
  const times = item.timesWorn ?? 0;
  const line = (label: string, value: string) => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
      <T v="sub" style={{ flex: 1 }}>
        {label}
      </T>
      <T v="strong">{value}</T>
    </View>
  );
  return (
    <Screen padBottom={40}>
      <AppBar title={item.name} onBack={() => navigation.goBack()} right={[{ icon: Pencil, label: 'Edit', onPress: () => navigation.navigate('ClothForm', { id: item.id }) }]} />
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <Thumb item={item} size={220} />
      </View>
      <Section>
        {line('Type', CATEGORIES.find((x) => x[0] === item.category)?.[1] ?? item.category)}
        {line('Colour', item.color)}
        {line('Good for', item.tags.filter((t) => OCCASIONS.some((o) => o[0] === t)).map((t) => OCCASIONS.find((o) => o[0] === t)![1]).join(', ') || 'Any time')}
        {line('Worn', times === 0 ? 'Not yet' : `${times} ${times === 1 ? 'time' : 'times'}`)}
        {item.lastWorn ? line('Last worn', new Date(`${item.lastWorn}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })) : null}
        {item.price ? line('Cost per wear', times ? rupees(item.price / times) : `${rupees(item.price)} (not worn yet)`) : null}
        {line('Status', item.isClean ? 'Clean' : 'In the laundry')}
      </Section>
      <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 18 }}>
        <Button title="See outfits with this" icon={Sparkles} onPress={() => navigation.navigate('Outfits', { pin: item.id })} />
        <Button title={item.isClean ? 'Put in the laundry' : 'Mark as washed'} icon={WashingMachine} variant="secondary" onPress={() => toggleCleanStatus(item.id)} />
        <Button
          title="Remove from closet"
          icon={Trash2}
          variant="secondary"
          onPress={() =>
            confirmAction('Remove from closet?', item.name, 'Remove', () => {
              deleteWardrobeItem(item.id);
              navigation.goBack();
            })
          }
        />
      </View>
    </Screen>
  );
};

export const ClothForm: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const { wardrobe, addWardrobeItem, updateWardrobeItem } = useStyleStore(useShallow(({ wardrobe, addWardrobeItem, updateWardrobeItem }) => ({ wardrobe, addWardrobeItem, updateWardrobeItem })));
  const existing = wardrobe.find((w) => w.id === route.params?.id);
  const [cat, setCat] = useState(CATEGORIES.find((x) => x[0] === existing?.category)?.[1] ?? 'Top');
  useEffect(() => {
    if (existing?.category === 'One-piece') setCat(kinds.find((x) => x[0] === 'One-piece')![1]);
  }, []);
  const [color, setColor] = useState(existing?.color ?? 'Black');
  const [occasions, setOccasions] = useState<string[]>(existing ? OCCASIONS.filter((o) => existing.tags.includes(o[0])).map((o) => o[1]) : ['Everyday']);
  const [warmth, setWarmth] = useState<'Light' | 'Medium' | 'Warm'>(existing?.warmth ?? 'Medium');
  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing?.price ? String(existing.price) : '');
  const [photo, setPhoto] = useState<string | null>(existing?.imageUri ?? null);
  const gender = useProfileStore((s) => s.profile.gender);
  const kinds = CATEGORIES.map((x) => (x[0] === 'One-piece' ? ([x[0], gender === 'Man' ? 'Kurta set, sherwani' : gender === 'Woman' ? 'Kurti, saree, dress' : x[1], x[2], x[3]] as const) : x));
  const meta = kinds.find((x) => x[1] === cat) ?? kinds[0];

  const save = (again: boolean) => {
    const finalName = name.trim() || `${color} ${meta[3]}`;
    const data = {
      name: finalName.charAt(0).toUpperCase() + finalName.slice(1),
      category: meta[0],
      color,
      fabric: existing?.fabric ?? 'Cotton',
      tags: [meta[0], ...OCCASIONS.filter((o) => occasions.includes(o[1])).map((o) => o[0])],
      maxWearsBeforeWash: meta[0] === 'Shoes' || meta[0] === 'Accessories' ? 30 : meta[0] === 'Outerwear' ? 5 : 2,
      idealWeatherMin: warmth === 'Warm' ? 0 : 14,
      idealWeatherMax: warmth === 'Warm' ? 22 : 40,
      warmth,
      price: Number(price) || undefined,
      imageEmoji: meta[2],
      imageUri: photo ?? undefined,
    };
    if (existing) updateWardrobeItem(existing.id, data);
    else addWardrobeItem(data);
    if (again && !existing) {
      setName('');
      setPhoto(null);
      setPrice('');
    } else navigation.goBack();
  };

  const takePhoto = async (camera: boolean) => {
    const u = camera ? await MediaPickerService.takePhoto([3, 4]) : await MediaPickerService.pickFromGallery([3, 4]);
    if (u) setPhoto(u);
  };

  return (
    <Form title={existing ? 'Edit item' : 'Add clothes'} onCancel={() => navigation.goBack()} onSave={() => save(false)}>
      <View style={{ paddingHorizontal: 16, marginBottom: 18, alignItems: 'center' }}>
        {photo ? <Image source={{ uri: photo }} style={{ width: 150, height: 200, borderRadius: 18, marginBottom: 10, backgroundColor: c.soft }} /> : null}
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Button title="Camera" icon={Camera} variant="secondary" style={{ flex: 1 }} onPress={() => takePhoto(true)} />
          <Button title="Gallery" icon={ImageIcon} variant="secondary" style={{ flex: 1 }} onPress={() => takePhoto(false)} />
        </View>
        <T v="caption" style={{ marginTop: 6 }}>
          A photo makes outfits easier to picture. Optional.
        </T>
      </View>
      <Pick label="What is it?" options={kinds.map((x) => x[1])} value={cat} onChange={setCat} columns={3} />
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8, paddingHorizontal: 16 }}>
          Colour
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
          {COLORS.map((name) => {
            const on = name === color;
            return (
              <TouchableOpacity key={name} onPress={() => setColor(name)} style={{ width: '20%', alignItems: 'center', paddingVertical: 8 }} accessibilityLabel={name} accessibilityState={{ selected: on }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLOR_SWATCH[name], borderWidth: on ? 3 : 1, borderColor: on ? c.accent : c.line }} />
                <T v="caption" style={{ marginTop: 4, fontSize: 11, fontWeight: on ? '700' : '400' }} color={on ? c.ink : undefined}>
                  {name}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8, paddingHorizontal: 16 }}>
          How warm is it?
        </T>
        <Segmented options={['Light', 'Medium', 'Warm']} value={warmth} onChange={(v) => setWarmth(v as 'Light' | 'Medium' | 'Warm')} style={{ marginHorizontal: 16 }} />
      </View>
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
                style={{ paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? c.accent : c.raised, borderWidth: 1, borderColor: on ? c.accent : c.line }}
              >
                <T v="sub" color={on ? '#FFFFFF' : c.ink} style={{ fontWeight: '600' }}>
                  {on ? `✓ ${label}` : label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Field label="Name (optional)" value={name} onChangeText={setName} maxLength={40} hint={`If empty we call it "${color} ${meta[3]}"`} />
      <Field label="Price (optional)" prefix="₹" value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} hint="Used to show the cost per wear" />
      {!existing ? <Button title="Save and add another" variant="secondary" style={{ marginHorizontal: 16 }} onPress={() => save(true)} /> : null}
    </Form>
  );
};
