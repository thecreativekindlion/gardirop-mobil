export type Category = 'ust' | 'alt' | 'elbise' | 'dis' | 'ayakkabi' | 'aksesuar';

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'ust', label: 'Üst' },
  { key: 'alt', label: 'Alt' },
  { key: 'elbise', label: 'Elbise' },
  { key: 'dis', label: 'Dış giyim' },
  { key: 'ayakkabi', label: 'Ayakkabı' },
  { key: 'aksesuar', label: 'Aksesuar' },
];

export const categoryLabel = (c: Category) =>
  CATEGORIES.find((x) => x.key === c)?.label ?? c;

export const SEASONS = ['Her mevsim', 'İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export const COLORS: { name: string; hex: string }[] = [
  { name: 'Siyah', hex: '#1a1a1a' },
  { name: 'Beyaz', hex: '#ffffff' },
  { name: 'Gri', hex: '#9e9e9e' },
  { name: 'Lacivert', hex: '#1f2a52' },
  { name: 'Mavi', hex: '#3b7dd8' },
  { name: 'Kırmızı', hex: '#d33b3b' },
  { name: 'Yeşil', hex: '#3f8f5a' },
  { name: 'Bej', hex: '#e2d3b5' },
  { name: 'Kahverengi', hex: '#7a5234' },
  { name: 'Pembe', hex: '#f0a3c0' },
  { name: 'Sarı', hex: '#f2c94c' },
  { name: 'Mor', hex: '#8a5cc7' },
];

export type Item = {
  id: string;
  user_id: string;
  name: string | null;
  category: Category;
  color: string | null;
  season: string | null;
  image_path: string;
  created_at: string;
};

export type Outfit = {
  id: string;
  user_id: string;
  name: string;
  item_ids: string[];
  created_at: string;
};

export type Plan = {
  id: string;
  user_id: string;
  outfit_id: string;
  date: string; // YYYY-MM-DD
};
