import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre gerekli.');
      return;
    }
    if (isRegister && password.length < 6) {
      Alert.alert('Şifre çok kısa', 'Şifre en az 6 karakter olmalı.');
      return;
    }

    setBusy(true);
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      setBusy(false);
      if (error) Alert.alert('Kayıt olunamadı', error.message);
      else if (!data.session) {
        Alert.alert('Neredeyse bitti', 'E-postana gelen onay bağlantısına tıkla, sonra giriş yap.');
        setMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) Alert.alert('Giriş yapılamadı', 'E-posta veya şifre hatalı.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>👗</Text>
        <Text style={styles.title}>Gardırobum</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Yeni hesap oluştur' : 'Hesabına giriş yap'}
        </Text>

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="Adın"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isRegister ? 'Kayıt ol' : 'Giriş yap'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')} style={{ marginTop: 20 }}>
          <Text style={styles.switch}>
            {isRegister ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {isRegister ? 'Giriş yap' : 'Kayıt ol'}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', color: colors.muted, marginBottom: 28, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switch: { textAlign: 'center', color: colors.muted, fontSize: 14 },
});
