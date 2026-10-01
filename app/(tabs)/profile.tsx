import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

export default function Profile() {
  const { session } = useAuth();
  const [counts, setCounts] = useState({ items: 0, outfits: 0 });

  const user = session?.user;
  const name = (user?.user_metadata?.full_name as string) || 'Merhaba!';

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('outfits').select('*', { count: 'exact', head: true }),
      ]).then(([i, o]) => setCounts({ items: i.count ?? 0, outfits: o.count ?? 0 }));
    }, [])
  );

  function logout() {
    Alert.alert('Çıkış yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(name[0] ?? '?').toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{counts.items}</Text>
          <Text style={styles.statLabel}>Kıyafet</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{counts.outfits}</Text>
          <Text style={styles.statLabel}>Kombin</Text>
        </View>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, backgroundColor: colors.bg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 14 },
  email: { color: colors.muted, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 28, width: '100%' },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { fontSize: 28, fontWeight: '700', color: colors.primary },
  statLabel: { color: colors.muted, marginTop: 4 },
  logout: {
    marginTop: 'auto',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
});
