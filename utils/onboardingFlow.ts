/**
 * Les parcours de l'onboarding, écran par écran (prototype validé le
 * 2026-10-28, issue #189).
 *
 * - create  : première ouverture, je lance une lecture
 * - join    : un lien ou un code, je rejoins une lecture
 * - add     : déjà inscrit·e, j'ajoute un livre (le « + »)
 * - addJoin : déjà inscrit·e, je rejoins avec un code
 *
 * La connexion (auth/login) se glisse avant tout (ou après l'invitation) et
 * « Tu lis quand ? » : elle n'est pas dans les listes, useAfterLogin y renvoie.
 */

import { useOnboardingStore } from '../stores/onboardingStore';

export type OnboardingFlow = 'create' | 'join' | 'add' | 'addJoin';

export type OnboardingStep =
  | 'choix'
  | 'code'
  | 'invitation'
  | 'rythme'
  | 'formats'
  | 'livre'
  | 'page'
  | 'objectif'
  | 'inviter'
  | 'notifications'
  | 'prepa'
  | 'carte';

const FLOWS: Record<OnboardingFlow, OnboardingStep[]> = {
  create: ['rythme', 'formats', 'choix', 'livre', 'page', 'objectif', 'inviter', 'notifications', 'prepa', 'carte'],
  join: ['rythme', 'formats', 'page', 'notifications', 'prepa', 'carte'],
  add: ['choix', 'livre', 'page', 'objectif', 'inviter', 'prepa', 'carte'],
  addJoin: ['page', 'prepa', 'carte'],
};

/** Les écrans à questions, ceux qui portent le fil de progression */
const ASKING: OnboardingStep[] = ['rythme', 'formats', 'choix', 'livre', 'page', 'objectif', 'inviter', 'notifications'];

/** L'écran qui suit, dans ce parcours */
export function nextStep(flow: OnboardingFlow, step: OnboardingStep): `/onboarding/${OnboardingStep}` {
  const steps = FLOWS[flow];
  const next = steps[steps.indexOf(step) + 1] ?? 'carte';
  return `/onboarding/${next}`;
}

/** Le premier écran après la connexion */
export function firstStep(flow: OnboardingFlow): `/onboarding/${OnboardingStep}` {
  return `/onboarding/${FLOWS[flow][0]}`;
}

/** Où en est le fil de progression, de 0 à 1 ; null hors des questions */
export function stepProgress(flow: OnboardingFlow, step: OnboardingStep): number | null {
  if (!ASKING.includes(step)) return null;
  const asked = FLOWS[flow].filter((s) => ASKING.includes(s));
  return (asked.indexOf(step) + 1) / (asked.length + 1);
}

/** Le parcours ajoute un livre à un compte existant : on peut le fermer */
export function isAddFlow(flow: OnboardingFlow) {
  return flow === 'add' || flow === 'addJoin';
}

/**
 * Ajouter un livre depuis l'app (le « + », la bibliothèque, l'accueil vide…) :
 * brouillon vierge, puis « Tu lances ou tu rejoins ? » — ou le code directement.
 */
export function startAdding(join = false): `/onboarding/${OnboardingStep}` {
  useOnboardingStore.getState().begin(join ? 'addJoin' : 'add');
  return join ? '/onboarding/code' : firstStep('add');
}
