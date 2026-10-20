import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';
import * as Location from 'expo-location';
import { localDate } from '../../core/date';

export interface SkincareStep {
  id: string;
  name: string;
  desc: string;
  emoji: string;
}

export type SkinSlot = 'am' | 'pm';

export type GarmentCategory = 'Tops' | 'Bottoms' | 'Shoes' | 'Outerwear' | 'Accessories';

export type OccasionType =
  | 'All'
  | 'Everyday Casual'
  | 'Date Night'
  | 'Work & Executive'
  | 'Outing & Party'
  | 'Gym & Active';

export interface WardrobeItem {
  id: string;
  name: string;
  category: GarmentCategory;
  color: string;
  fabric: string;
  tags: string[];
  wearCount: number;
  maxWearsBeforeWash: number;
  isClean: boolean;
  idealWeatherMin: number;
  idealWeatherMax: number;
  imageEmoji: string;
  imageUri?: string;
  brand?: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  feelsLike: number;
  highTemp: number;
  lowTemp: number;
  precipitationProb: number;
  needsUmbrella: boolean;
  umbrellaAdvice: string;
  weatherCode: number;
  isLive: boolean;
  lastUpdated: string;
}

export interface StyleState {
  skincare: Record<SkinSlot, SkincareStep[]>;
  skincareDone: { day: string; am: string[]; pm: string[] };
  toggleSkincareStep: (slot: SkinSlot, id: string) => void;
  addSkincareStep: (slot: SkinSlot, name: string) => void;
  removeSkincareStep: (slot: SkinSlot, id: string) => void;
  weather: WeatherData;
  wardrobe: WardrobeItem[];
  selectedOccasion: OccasionType;
  setSelectedOccasion: (occ: OccasionType) => void;
  selectedOutfitId: string | null;
  setSelectedOutfitId: (id: string | null) => void;
  fetchLiveWeather: (lat?: number, lon?: number, cityName?: string) => Promise<void>;
  detectLocationAndWeather: () => Promise<void>;
  searchCityWeather: (cityName: string) => Promise<boolean>;
  logWear: (id: string) => void;
  logOutfitWorn: (itemIds: string[]) => void;
  washItem: (id: string) => void;
  toggleCleanStatus: (id: string) => void;
  washAllLaundry: () => void;
  addWardrobeItem: (item: Omit<WardrobeItem, 'id' | 'wearCount' | 'isClean'>) => void;
  deleteWardrobeItem: (id: string) => void;
}

export const useStyleStore = create<StyleState>()(
  persist((set, get) => ({
  skincare: {
    am: [
      { id: 'am1', name: 'Cleanser', desc: 'Wash your face', emoji: '🫧' },
      { id: 'am2', name: 'Moisturiser', desc: 'Keeps skin from drying out', emoji: '🧴' },
      { id: 'am3', name: 'Sunscreen', desc: 'SPF 30 or more, even indoors', emoji: '☀️' },
    ],
    pm: [
      { id: 'pm1', name: 'Cleanser', desc: 'Remove sunscreen and dust', emoji: '🧼' },
      { id: 'pm2', name: 'Moisturiser', desc: 'Night hydration', emoji: '🌙' },
    ],
  },
  skincareDone: { day: localDate(), am: [], pm: [] },
  toggleSkincareStep: (slot, id) => {
    const today = localDate();
    const done = get().skincareDone.day === today ? get().skincareDone : { day: today, am: [], pm: [] };
    const list = done[slot].includes(id) ? done[slot].filter((s) => s !== id) : [...done[slot], id];
    set({ skincareDone: { ...done, [slot]: list } });
  },
  addSkincareStep: (slot, name) =>
    set((s) => ({
      skincare: { ...s.skincare, [slot]: [...s.skincare[slot], { id: `${slot}-${Date.now()}`, name, desc: '', emoji: '✨' }] },
    })),
  removeSkincareStep: (slot, id) =>
    set((s) => ({ skincare: { ...s.skincare, [slot]: s.skincare[slot].filter((step) => step.id !== id) } })),
  weather: {
    city: 'Bengaluru, India',
    temperature: 31,
    condition: 'Partly Cloudy',
    humidity: 33,
    feelsLike: 32,
    highTemp: 32,
    lowTemp: 21,
    precipitationProb: 16,
    needsUmbrella: false,
    umbrellaAdvice: 'No umbrella needed today • Clear skies',
    weatherCode: 3,
    isLive: false,
    lastUpdated: 'Just now',
  },

  selectedOccasion: 'Everyday Casual',
  setSelectedOccasion: (occ) => set({ selectedOccasion: occ }),

  selectedOutfitId: null,
  setSelectedOutfitId: (id) => set({ selectedOutfitId: id }),

  wardrobe: [],

  logWear: (id) => {
    set((state) => ({
      wardrobe: state.wardrobe.map((item) => {
        if (item.id === id) {
          const nextCount = item.wearCount + 1;
          return {
            ...item,
            wearCount: nextCount,
            isClean: nextCount < item.maxWearsBeforeWash,
          };
        }
        return item;
      }),
    }));
  },

  logOutfitWorn: (itemIds) => {
    set((state) => ({
      wardrobe: state.wardrobe.map((item) => {
        if (itemIds.includes(item.id)) {
          const nextCount = item.wearCount + 1;
          return {
            ...item,
            wearCount: nextCount,
            isClean: nextCount < item.maxWearsBeforeWash,
          };
        }
        return item;
      }),
    }));
  },

  washItem: (id) => {
    set((state) => ({
      wardrobe: state.wardrobe.map((item) =>
        item.id === id ? { ...item, wearCount: 0, isClean: true } : item
      ),
    }));
  },

  toggleCleanStatus: (id) => {
    set((state) => ({
      wardrobe: state.wardrobe.map((item) =>
        item.id === id
          ? {
              ...item,
              isClean: !item.isClean,
              wearCount: !item.isClean ? 0 : item.maxWearsBeforeWash,
            }
          : item
      ),
    }));
  },

  washAllLaundry: () => {
    set((state) => ({
      wardrobe: state.wardrobe.map((item) => ({
        ...item,
        wearCount: 0,
        isClean: true,
      })),
    }));
  },

  addWardrobeItem: (newItem) => {
    const item: WardrobeItem = {
      ...newItem,
      id: 'w-' + Date.now(),
      wearCount: 0,
      isClean: true,
    };
    set((state) => ({ wardrobe: [item, ...state.wardrobe] }));
  },

  deleteWardrobeItem: (id) => {
    set((state) => ({
      wardrobe: state.wardrobe.filter((item) => item.id !== id),
    }));
  },

  fetchLiveWeather: async (lat = 12.9716, lon = 77.5946, cityName = 'Bengaluru, India') => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      const temp = Math.round(data.current?.temperature_2m ?? 31);
      const humidity = Math.round(data.current?.relative_humidity_2m ?? 35);
      const feelsLike = Math.round(data.current?.apparent_temperature ?? temp);
      const code = data.current?.weather_code ?? 1;
      const highTemp = Math.round(data.daily?.temperature_2m_max?.[0] ?? temp + 2);
      const lowTemp = Math.round(data.daily?.temperature_2m_min?.[0] ?? temp - 6);
      const precipitationProb = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 10);

      const isRainyCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
      const needsUmbrella = isRainyCode || precipitationProb >= 40;

      let condition = 'Partly Cloudy';
      if (code === 0) condition = 'Clear Sky';
      else if (code === 1 || code === 2) condition = 'Mostly Sunny';
      else if (code === 3) condition = 'Partly Cloudy';
      else if (code >= 51 && code <= 55) condition = 'Light Drizzle';
      else if (code >= 61 && code <= 65) condition = 'Rain Showers';
      else if (code >= 80 && code <= 82) condition = 'Heavy Rain';
      else if (code >= 95) condition = 'Thunderstorm';

      const umbrellaAdvice = needsUmbrella
        ? `Take an umbrella · ${precipitationProb}% chance of rain`
        : `No umbrella needed · ${precipitationProb}% chance of rain`;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      set({
        weather: {
          city: cityName,
          temperature: temp,
          condition,
          humidity,
          feelsLike,
          highTemp,
          lowTemp,
          precipitationProb,
          needsUmbrella,
          umbrellaAdvice,
          weatherCode: code,
          isLive: true,
          lastUpdated: timeStr,
        },
      });
    } catch {
    }
  },

  detectLocationAndWeather: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (pos?.coords) {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          const city = geo?.city || geo?.subregion || geo?.region || 'Current Location';
          const country = geo?.country ? `, ${geo.country}` : '';
          await get().fetchLiveWeather(pos.coords.latitude, pos.coords.longitude, `${city}${country}`);
          return;
        }
      }
    } catch {
    }

    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.latitude && ipData.longitude) {
          const cityStr = `${ipData.city || 'Local'}, ${ipData.country_name || 'India'}`;
          await get().fetchLiveWeather(ipData.latitude, ipData.longitude, cityStr);
          return;
        }
      }
    } catch {
    }

    await get().fetchLiveWeather();
  },

  searchCityWeather: async (cityName: string) => {
    if (!cityName.trim()) return false;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.results || data.results.length === 0) return false;

      const first = data.results[0];
      const displayName = `${first.name}${first.admin1 ? ', ' + first.admin1 : ''}, ${first.country || ''}`;
      await get().fetchLiveWeather(first.latitude, first.longitude, displayName);
      return true;
    } catch {
      return false;
    }
  },
}), { name: 'lifeos-style', storage: persistStorage })
);
