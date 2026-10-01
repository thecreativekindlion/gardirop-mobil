import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ItemThumbs } from '../../components/ItemThumbs';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { Item, Outfit, Plan } from '../../lib/types';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_COUNT = 14;

// Yerel saate göre YYYY-MM-DD
function toKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function PlanScreen() {
  const { session } = useAuth();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});
  const [loading, setLoading] = useState(true);
  const [pickingDate, setPickingDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAY_COUNT }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      return { key: toKey(d), date: d, isToday: i === 0 };
    });
  }, []);

  const load = useCallback(async () => {
    const [p, o, i] = await Promise.all([
      supabase.from('plans').select('*').gte('date', days[0].key).lte('date', days[days.length - 1].key),
      supabase.from('outfits').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*'),
    ]);
    const err = p.error ?? o.error ?? i.error;
    if (err) Alert.alert('Hata', err.message);
    else {
      setPlans(Object.fromEntries((p.data as Plan[]).map((x) => [x.date, x])));
      setOutfits(o.data as Outfit[]);
      setItemsById(Object.fromEntries((i.data as Item[]).map((x) => [x.id, x])));
    }
    setLoading(false);
  }, [days]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function assign(date: string, outfitId: string) {
    if (!session) return;
    setPickingDate(null);
    const { data, error } = await supabase
      .from('plans')
      .upsert({ user_id: session.user.id, date, outfit_id: outfitId }, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) return Alert.alert('Kaydedilemedi', error.message);
    setPlans((prev) => ({ ...prev, [date]: data as Plan }));
  }

  async function clear(date: string) {
    setPickingDate(null);
    const plan = plans[date];
    if (!plan) return;
    const { error } = await supabase.from('plans').delete().eq('id', plan.id);
    if (error) return Alert.alert('Silinemedi', error.message);
    setPlans((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }

  const outfitById = (id: string) => outfits.find((o) => o.id === id);
  const partsOf = (o: Outfit) => o.item_ids.map((id) => itemsById[id]).filter(Boolean);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={days}
        keyExtractor={(d) => d.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshing={false}
        onRefresh={load}
        renderItem={({ item: day }) => {
          const plan = plans[day.key];
          const outfit = plan ? outfitById(plan.outfit_id) : undefined;
          return (
            <Pressable style={[styles.row, day.isToday && styles.today]} onPress={() => setPickingDate(day.key)}>
              <View style={styles.dateCol}>
                <Text style={styles.dayNum}>{day.date.getDate()}</Text>
                <Text style={styles.month}>{MONTHS[day.date.getMonth()].slice(0, 3)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayName}>
                  {day.isToday ? 'Bugün' : DAYS[day.date.getDay()]}
                </Text>
                {outfit ? (
                  <>
                    <Text style={styles.outfitName}>{outfit.name}</Text>
                    <View style={{ marginTop: 8 }}>
                      <ItemThumbs items={partsOf(outfit)} size={44} />
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholder}>+ Kombin seç</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <Modal visible={!!pickingDate} animationType="slide" transparent onRequestClose={() => setPickingDate(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Kombin seç</Text>
              <Pressable onPress={() => setPickingDate(null)} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {outfits.length === 0 && (
                <Text style={styles.placeholder}>Önce "Kombinler" sekmesinden bir kombin oluştur.</Text>
              )}
              {outfits.map((o) => {
                const active = pickingDate && plans[pickingDate]?.outfit_id === o.id;
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.option, active && { borderColor: colors.primary }]}
                    onPress={() => pickingDate && assign(pickingDate, o.id)}
                  >
                    <Text style={styles.outfitName}>{o.name}</Text>
                    <View style={{ marginTop: 8 }}>
                      <ItemThumbs items={partsOf(o)} size={48} />
                    </View>
                  </Pressable>
                );
              })}
              {pickingDate && plans[pickingDate] && (
                <Pressable onPress={() => clear(pickingDate)} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.danger, textAlign: 'center', fontWeight: '600' }}>
                    Bu günün planını kaldır
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  today: { borderColor: colors.primary, borderWidth: 2 },
  dateCol: { width: 52, alignItems: 'center', marginRight: 12 },
  dayNum: { fontSize: 24, fontWeight: '700', color: colors.text },
  month: { fontSize: 12, color: colors.muted, textTransform: 'uppercase' },
  dayName: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  outfitName: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 2 },
  placeholder: { color: colors.primary, marginTop: 6, fontSize: 15 },
  backdrop: { flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  option: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
