import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Chip } from '../components/Chip';
import { useAuth } from '../lib/auth';
import { imageUrl, supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { CATEGORIES, Category, Item } from '../lib/types';

export default function CreateOutfit() {
  const { session } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) Alert.alert('Hata', error.message);
        else setItems(data as Item[]);
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    if (!name.trim()) return Alert.alert('İsim gerekli', 'Kombinine bir isim ver (ör. "Ofis - Pazartesi").');
    if (selected.length < 2) return Alert.alert('Parça seç', 'Bir kombin için en az 2 parça seç.');
    if (!session) return;

    setBusy(true);
    const { error } = await supabase
      .from('outfits')
      .insert({ user_id: session.user.id, name: name.trim(), item_ids: selected });
    if (error) {
      setBusy(false);
      return Alert.alert('Kaydedilemedi', error.message);
    }
    router.back();
  }

  const shown = filter === 'all' ? items : items.filter((i) => i.category === filter);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <TextInput
          style={styles.input}
          placeholder="Kombin adı"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
      >
        <Chip label="Tümü" active={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={filter === c.key} onPress={() => setFilter(c.key)} />
        ))}
      </ScrollView>

      <FlatList
        data={shown}
        keyExtractor={(i) => i.id}
        numColumns={3}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {items.length === 0 ? 'Önce gardırobuna kıyafet eklemelisin.' : 'Bu kategoride kıyafet yok.'}
          </Text>
        }
        renderItem={({ item }) => {
          const isOn = selected.includes(item.id);
          return (
            <Pressable style={[styles.tile, isOn && styles.tileOn]} onPress={() => toggle(item.id)}>
              <Image source={{ uri: imageUrl(item.image_path) }} style={styles.image} />
              {isOn && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kombini kaydet ({selected.length} parça)</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  tile: {
    flex: 1,
    margin: 4,
    maxWidth: '31%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  tileOn: { borderColor: colors.primary },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.border },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 15 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
