import { Image, ScrollView, StyleSheet } from 'react-native';
import { imageUrl } from '../lib/supabase';
import { colors } from '../lib/theme';
import { Item } from '../lib/types';

export function ItemThumbs({ items, size = 64 }: { items: Item[]; size?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      {items.map((it) => (
        <Image
          key={it.id}
          source={{ uri: imageUrl(it.image_path) }}
          style={[styles.thumb, { width: size, height: size * 1.25 }]}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: 10, marginRight: 8, backgroundColor: colors.border },
});
