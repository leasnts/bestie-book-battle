/**
 * Connexion par email, au plus simple : pas de mot de passe.
 *
 * Sheet natif (`SheetPage`) ouvert depuis l'écran de connexion, en trois temps :
 * 1. l'adresse → Supabase envoie un code à 6 chiffres ;
 * 2. le code (iOS le propose au-dessus du clavier dès que le mail arrive),
 *    vérifié tout seul au 6ᵉ chiffre ;
 * 3. nouveau compte seulement : le prénom (Apple le donne, l'email non).
 */

import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import Button3D from '../../components/Button3D';
import SheetPage, { SheetFooter } from '../../components/ui/SheetPage';
import { useAfterLogin } from '../../hooks/useAfterLogin';
import { sendEmailCode, type AppleSignInResult } from '../../services/supabase/auth';
import { useAuthStore } from '../../stores/authStore';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../../utils/constants';

const CODE_LENGTH = 6;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

type Step = 'email' | 'code' | 'name';

export default function EmailLoginSheet() {
  const loginWithEmail = useAuthStore((state) => state.loginWithEmail);
  const setPendingUserData = useAuthStore((state) => state.setPendingUserData);
  const afterLogin = useAfterLogin();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const result = useRef<AppleSignInResult | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(email.trim().toLowerCase());
      setCode('');
      setStep('code');
    } catch (e: any) {
      setError(e?.status === 429 ? 'Trop d’essais, réessaie dans quelques minutes' : 'Envoi impossible, vérifie ton adresse');
    } finally {
      setBusy(false);
    }
  };

  const checkCode = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await loginWithEmail(email.trim().toLowerCase(), value);
      if (res.isNewUser) {
        result.current = res;
        setStep('name');
      } else {
        await afterLogin(res);
      }
    } catch {
      setError('Code incorrect ou expiré');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const onCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) checkCode(digits);
  };

  const finish = async () => {
    const res = result.current;
    if (!res) return;
    const name = firstName.trim();
    const pending = useAuthStore.getState().pendingUserData;
    if (pending) setPendingUserData({ ...pending, firstName: name });
    await afterLogin(res, name);
  };

  if (step === 'code') {
    return (
      <SheetPage title="Ton code" subtitle={email.trim()} onBack={() => setStep('email')}>
        <TextInput
          key="code"
          style={[styles.input, styles.code]}
          value={code}
          onChangeText={onCodeChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          placeholderTextColor={colors.placeholder}
          editable={!busy}
          autoFocus
          accessibilityLabel="Code reçu par email"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <SheetFooter>
          <Button3D onPress={sendCode} variant="secondary" disabled={busy}>
            Renvoyer le code
          </Button3D>
        </SheetFooter>
      </SheetPage>
    );
  }

  if (step === 'name') {
    return (
      <SheetPage title="Ton prénom">
        <TextInput
          key="name"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          textContentType="givenName"
          autoComplete="given-name"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={() => firstName.trim() && finish()}
          placeholder="Prénom"
          placeholderTextColor={colors.placeholder}
          autoFocus
        />
        <SheetFooter>
          <Button3D onPress={finish} variant="primary" disabled={!firstName.trim()}>
            Continuer
          </Button3D>
        </SheetFooter>
      </SheetPage>
    );
  }

  return (
    <SheetPage title="Ton email">
      <TextInput
        key="email"
        style={styles.input}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setError(null);
        }}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={() => isEmail(email) && sendCode()}
        placeholder="toi@exemple.fr"
        placeholderTextColor={colors.placeholder}
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <SheetFooter>
        <Button3D onPress={sendCode} variant="primary" loading={busy} disabled={!isEmail(email)}>
          Recevoir un code
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    // Remis à zéro : iOS recycle le champ du code, qui garderait son espacement
    letterSpacing: 0,
    ...shadows.xs,
  },
  code: {
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
