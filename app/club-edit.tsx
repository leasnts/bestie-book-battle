/**
 * Route /club-edit — faire un club d'un groupe de lecture, ou le modifier (#238).
 *
 * - `?challengeId=` : « Faire un club », depuis le « … » de la fiche du livre
 *   (admin d'une lecture sans club). Tout le groupe suit dans le club.
 * - `?id=` : modifier le nom ou la photo d'un club (admins), depuis sa page.
 * - sans rien : créer un club de zéro, sans lecture (onglet Clubs) ; sa page
 *   s'ouvre ensuite.
 *
 *          ( 📷 )          la photo, ronde, cousue tant qu'elle manque
 *   [ Les Liseuses   12/20 ]
 *   (◐◐◐) Emma, Lucas et 4 autres
 *   [ Créer le club ]
 *
 * Le nom tient en 20 caractères : le champ s'arrête là, le compteur le dit.
 * Pas de réglage ici (rejoindre = le lien suffit) : un écran, une question.
 */

import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { InputAccessoryView, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Button3D from '../components/Button3D';
import ClubAvatar from '../components/ui/ClubAvatar';
import PressableScale from '../components/ui/PressableScale';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { StitchBorder } from '../components/ui/Stitch';
import { CLUB_NAME_MAX, createClub, createClubFromChallenge, updateClub, uploadClubPhoto } from '../services/supabase/clubs';
import { pickImage } from '../services/supabase/storage';
import { useAuthStore } from '../stores/authStore';
import { useClubStore } from '../stores/clubStore';
import { useProgressStore } from '../stores/progressStore';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, paperFrameGradient, spacing } from '../utils/constants';
import { buzz } from '../utils/feel';
import { nudge, oops } from '../utils/notice';
import { resolvePhotoSource } from '../utils/profilePhoto';
import { LinearGradient } from 'expo-linear-gradient';

const ACCESSORY_ID = 'club-edit-no-done';
const PHOTO = 112;
const MEMBER = 26;

export default function ClubEditRoute() {
  const router = useRouter();
  const { id, challengeId, from } = useLocalSearchParams<{ id?: string; challengeId?: string; from?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const club = useClubStore((s) => (id ? s.clubs[id] : undefined));
  const putClub = useClubStore((s) => s.putClub);
  const patchChallengeLocally = useProjectStore((s) => s.patchChallengeLocally);
  const participants = useProgressStore((s) => s.participants);

  const [name, setName] = useState(club?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Le groupe qui suit dans le club (création seulement) : les autres, pas moi
  const others = useMemo(
    () =>
      challengeId
        ? participants.filter((p) => p.progress.challenge_id === challengeId && p.user.id !== userId).map((p) => p.user)
        : [],
    [participants, challengeId, userId],
  );

  const pickPhoto = async () => {
    try {
      const uri = await pickImage(true, [1, 1], 0.8);
      if (uri) setPhotoUri(uri);
    } catch (error) {
      oops('Photo pas choisie', error);
    }
  };

  const save = async () => {
    Keyboard.dismiss();
    const trimmed = name.trim();
    if (!trimmed) {
      nudge('Il manque le nom du club', 'Écris-le juste au-dessus');
      return;
    }
    setSaving(true);
    try {
      if (challengeId) {
        const created = await createClubFromChallenge(challengeId, trimmed, photoUri);
        putClub(created);
        patchChallengeLocally(challengeId, { club_id: created.id });
      } else if (club) {
        const photo_url = photoUri ? await uploadClubPhoto(club.id, photoUri) : club.photo_url;
        putClub(await updateClub(club.id, { name: trimmed, photo_url }));
      } else {
        const created = await createClub(trimmed, photoUri);
        putClub(created);
        buzz('success');
        router.replace(`/club?id=${created.id}`);
        return;
      }
      buzz('success');
      router.back();
    } catch (error) {
      oops(club ? 'Club pas modifié' : 'Club pas créé', error, { retry: () => save() });
    } finally {
      setSaving(false);
    }
  };

  const preview = photoUri ?? club?.photo_url ?? null;

  return (
    <SheetPage
      title={club ? 'Modifier le club' : challengeId ? 'Faire un club' : 'Créer un club'}
      accent="club"
      onBack={from ? () => router.back() : undefined}
    >
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View />
      </InputAccessoryView>

      <PressableScale
        style={styles.photo}
        pressedScale={0.96}
        onPress={pickPhoto}
        accessibilityRole="button"
        accessibilityLabel={preview ? 'Changer la photo du club' : 'Ajouter une photo du club'}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : club ? (
          <ClubAvatar club={club} size={PHOTO} />
        ) : (
          <>
            <LinearGradient colors={paperFrameGradient} style={StyleSheet.absoluteFill} />
            <StitchBorder radius={PHOTO / 2} />
            <CameraIcon size={30} color={colors.textTertiary} strokeWidth={2} />
          </>
        )}
      </PressableScale>

      <View style={styles.field}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={CLUB_NAME_MAX}
          placeholder="Les Liseuses"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          onSubmitEditing={save}
          inputAccessoryViewID={ACCESSORY_ID}
          autoCapitalize="sentences"
          accessibilityLabel="Nom du club"
        />
        <Text style={styles.count}>
          {name.length}/{CLUB_NAME_MAX}
        </Text>
      </View>

      {others.length > 0 && (
        <View style={styles.who}>
          <View style={styles.stack}>
            {others.slice(0, 4).map((u, i) => (
              <Image
                key={u.id}
                source={resolvePhotoSource(u.profile_photo_url)}
                style={[styles.member, i > 0 && styles.memberOver]}
              />
            ))}
          </View>
          <Text style={styles.whoText} numberOfLines={1}>
            {groupLabel(others.map((u) => u.first_name || '?'))}
          </Text>
        </View>
      )}

      <SheetFooter>
        <Button3D variant="primary" onPress={save} loading={saving}>
          {club ? 'Enregistrer' : 'Créer le club'}
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

/** « Emma », « Emma et Lucas », « Emma, Lucas et 4 autres » */
function groupLabel(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]} et ${rest} autre${rest > 1 ? 's' : ''}`;
}

const styles = StyleSheet.create({
  photo: {
    alignSelf: 'center',
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingRight: spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  count: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
  },
  stack: {
    flexDirection: 'row',
  },
  member: {
    width: MEMBER,
    height: MEMBER,
    borderRadius: MEMBER / 2,
    borderWidth: 2,
    borderColor: colors.white,
  },
  memberOver: {
    marginLeft: -8,
  },
  whoText: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
});
