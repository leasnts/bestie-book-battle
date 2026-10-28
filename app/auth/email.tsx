/**
 * Connexion par email, au plus simple : pas de mot de passe.
 *
 * Sheet natif (`SheetPage`) ouvert depuis l'écran de connexion, en trois temps :
 * 1. l'adresse → Supabase envoie un code à 6 chiffres ;
 * 2. le code, une case par chiffre (un seul champ caché dessous : le coller ou
 *    la suggestion d'iOS remplit tout d'un coup), vérifié tout seul au 6ᵉ
 *    chiffre ; « Renvoyer » attend 60 s, compte à rebours affiché ;
 * 3. nouveau compte seulement : le prénom (Apple le donne, l'email non).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import Button3D from '../../components/Button3D';
import SheetPage, { SheetFooter, SheetSubtitle } from '../../components/ui/SheetPage';
import { useAfterLogin } from '../../hooks/useAfterLogin';
import { sendEmailCode, type AppleSignInResult } from '../../services/supabase/auth';
import { useAuthStore } from '../../stores/authStore';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../../utils/constants';

const CODE_LENGTH = 6;
/** Supabase refuse un nouveau code pour la même adresse avant 60 s (smtp_max_frequency). */
const RESEND_DELAY = 60;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Six cases, une par chiffre. Elles ne font que montrer : la saisie passe par
 * un seul champ invisible posé dessus, qui garde le collage et l'autoremplissage.
 */
function CodeBoxes({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
}) {
  const input = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(true);
  return (
    <Pressable onPress={() => input.current?.focus()} accessible={false}>
      <View style={styles.boxes}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const active = focused && editable && i === Math.min(value.length, CODE_LENGTH - 1);
          return (
            <View key={i} style={[styles.box, active && styles.boxActive]}>
              <Text style={styles.digit}>{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        editable={editable}
        caretHidden
        autoFocus
        accessibilityLabel="Code reçu par email"
      />
    </Pressable>
  );
}

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
  /** Secondes avant de pouvoir redemander un code */
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const result = useRef<AppleSignInResult | null>(null);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(email.trim().toLowerCase());
      setCode('');
      setStep('code');
      setWait(RESEND_DELAY);
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
      <SheetPage
        title="Ton code"
        subtitle={
          <SheetSubtitle>
            Code envoyé à <Text style={styles.strong}>{email.trim()}</Text>
          </SheetSubtitle>
        }
        onBack={() => setStep('email')}
      >
        <CodeBoxes value={code} onChange={onCodeChange} editable={!busy} />
        {error && <Text style={styles.error}>{error}</Text>}
        <SheetFooter>
          <Button3D onPress={sendCode} variant="primary" disabled={busy || wait > 0}>
            {wait > 0 ? `Renvoyer dans ${wait} s` : 'Renvoyer le code'}
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
    ...shadows.xs,
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },
  boxActive: {
    borderColor: colors.textSecondary,
    borderWidth: 1.5,
  },
  digit: {
    fontFamily: fonts.body,
    fontSize: 26,
    color: colors.textPrimary,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.02,
  },
  strong: {
    fontFamily: fonts.bodyBold,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
