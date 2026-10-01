import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ItemThumbs } from '../../components/ItemThumbs';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { Item, Outfit } from '../../lib/types';

export default function Outfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [o, i] = await Promise.all([
      supabase.from('outfits').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*'),
    ]);
    if (o.error || i.error) Alert.alert('Hata', (o.error ?? i.error)!.message);
    else {
      setOutfits(o.data as Outfit[]);
      setItemsById(Object.fromEntries((i.data as Item[]).map((x) => [x.id, x])));
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(outfit: Outfit) {
    Alert.alert('Kombin silinsin mi?', `"${outfit.name}" ve buna ait planlar silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('outfits').delete().eq('id', outfit.id);
          if (error) return Alert.alert('Silinemedi', error.message);
          setOutfits((prev) => prev.filter((x) => x.id !== outfit.id));
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshing={false}
          onRefresh={load}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>✨</Text>
              <Text style={styles.emptyText}>
                Henüz kombinin yok. Gardırobundaki parçaları birleştirerek ilk kombinini oluştur.
              </Text>
            </View>
          }
          renderItem={({ item: outfit }) => {
            // Silinmiş kıyafetleri atla
            const parts = outfit.item_ids.map((id) => itemsById[id]).filter(Boolean);
            return (
              <Pressable style={styles.card} onLongPress={() => confirmDelete(outfit)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{outfit.name}</Text>
                  <Text style={styles.count}>{parts.length} parça</Text>
                </View>
                <ItemThumbs items={parts} />
              </Pressable>
            );
          }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/create-outfit')}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  count: { color: colors.muted, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
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
