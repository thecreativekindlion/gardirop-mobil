import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Chip } from '../../components/Chip';
import { BUCKET, imageUrl, supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { CATEGORIES, Category, categoryLabel, Item } from '../../lib/types';

export default function Wardrobe() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('Hata', error.message);
    else setItems(data as Item[]);
    setLoading(false);
  }, []);

  // Ekrana her dönüldüğünde (ör. kıyafet ekledikten sonra) listeyi yenile
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(item: Item) {
    Alert.alert('Silinsin mi?', `${item.name || categoryLabel(item.category)} gardıroptan silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('items').delete().eq('id', item.id);
          if (error) return Alert.alert('Silinemedi', error.message);
          await supabase.storage.from(BUCKET).remove([item.image_path]);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  }

  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}
      >
        <Chip label={`Tümü (${items.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={filter === c.key} onPress={() => setFilter(c.key)} />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          refreshing={false}
          onRefresh={load}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🧺</Text>
              <Text style={styles.emptyText}>
                {items.length === 0
                  ? 'Gardırobun boş. Sağ alttaki + ile ilk kıyafetini ekle.'
                  : 'Bu kategoride kıyafet yok.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onLongPress={() => confirmDelete(item)}>
              <Image source={{ uri: imageUrl(item.image_path) }} style={styles.image} />
              <View style={{ padding: 10 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name || categoryLabel(item.category)}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[categoryLabel(item.category), item.color, item.season].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/add-item')}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '47%',
  },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.border },
  name: { fontWeight: '600', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { textAlign: 'center', color: colors.muted, marginTop: 12, fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
