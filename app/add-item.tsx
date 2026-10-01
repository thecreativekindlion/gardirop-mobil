import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { BUCKET, supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { CATEGORIES, Category, COLORS, SEASONS } from '../lib/types';

export default function AddItem() {
  const { session } = useAuth();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('ust');
  const [color, setColor] = useState<string | null>(null);
  const [season, setSeason] = useState(SEASONS[0]);
  const [busy, setBusy] = useState(false);

  async function pick(fromCamera: boolean) {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin gerekli', 'Fotoğraf çekmek için kamera izni vermelisin.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6, // dosya boyutunu küçük tutar
      base64: true,
    };
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!res.canceled) setImage(res.assets[0]);
  }

  async function save() {
    if (!image?.base64) {
      Alert.alert('Fotoğraf gerekli', 'Önce kıyafetin fotoğrafını ekle.');
      return;
    }
    if (!session) return;

    setBusy(true);
    try {
      const contentType = image.mimeType ?? 'image/jpeg';
      const ext = contentType.split('/')[1] ?? 'jpg';
      // Her kullanıcının fotoğrafları kendi klasöründe: <user_id>/<zaman>.jpg
      const path = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, decode(image.base64), { contentType });
      if (upErr) throw upErr;

      const { error } = await supabase.from('items').insert({
        user_id: session.user.id,
        name: name.trim() || null,
        category,
        color,
        season,
        image_path: path,
      });
      if (error) throw error;

      router.back();
    } catch (e: any) {
      setBusy(false);
      Alert.alert('Kaydedilemedi', e?.message ?? 'Bilinmeyen hata');
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {image ? (
        <Pressable onPress={() => pick(false)}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <Text style={styles.hint}>Değiştirmek için dokun</Text>
        </Pressable>
      ) : (
        <View style={styles.pickRow}>
          <Pressable style={styles.pickBox} onPress={() => pick(true)}>
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
            <Text style={styles.pickText}>Fotoğraf çek</Text>
          </Pressable>
          <Pressable style={styles.pickBox} onPress={() => pick(false)}>
            <Ionicons name="images-outline" size={32} color={colors.primary} />
            <Text style={styles.pickText}>Galeriden seç</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.label}>İsim (isteğe bağlı)</Text>
      <TextInput
        style={styles.input}
        placeholder="ör. Beyaz keten gömlek"
        placeholderTextColor={colors.muted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Kategori</Text>
      <View style={styles.wrap}>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </View>

      <Text style={styles.label}>Renk</Text>
      <View style={styles.wrap}>
        {COLORS.map((c) => (
          <Chip
            key={c.name}
            label={c.name}
            dot={c.hex}
            active={color === c.name}
            onPress={() => setColor(color === c.name ? null : c.name)}
          />
        ))}
      </View>

      <Text style={styles.label}>Mevsim</Text>
      <View style={styles.wrap}>
        {SEASONS.map((s) => (
          <Chip key={s} label={s} active={season === s} onPress={() => setSeason(s)} />
        ))}
      </View>

      <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gardıroba ekle</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pickRow: { flexDirection: 'row', gap: 12 },
  pickBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickText: { color: colors.primary, marginTop: 8, fontWeight: '600' },
  preview: { width: '60%', aspectRatio: 3 / 4, borderRadius: 16, alignSelf: 'center' },
  hint: { textAlign: 'center', color: colors.muted, marginTop: 6, fontSize: 12 },
  label: { fontWeight: '600', color: colors.text, marginTop: 22, marginBottom: 10, fontSize: 15 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
