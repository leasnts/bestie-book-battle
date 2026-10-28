/**
 * Les parcours de l'onboarding, écran par écran (prototype validé le
 * 2026-10-28, issue #189).
 *
 * - create  : première ouverture, je lance une lecture
 * - join    : un lien ou un code, je rejoins une lecture
 * - add     : déjà inscrit·e, j'ajoute un livre (le « + »)
 * - addJoin : déjà inscrit·e, je rejoins avec un code
 *
 * La connexion (auth/login) se glisse entre l'ouverture (ou l'invitation) et
 * « Ton rythme » : elle n'est pas dans les listes, useAfterLogin y renvoie.
 */

import { useOnboardingStore } from '../stores/onboardingStore';

export type OnboardingFlow = 'create' | 'join' | 'add' | 'addJoin';

export type OnboardingStep =
  | 'intro'
  | 'code'
  | 'invitation'
  | 'rythme'
  | 'livre'
  | 'page'
  | 'objectif'
  | 'inviter'
  | 'notifications'
  | 'prepa'
  | 'carte';

const FLOWS: Record<OnboardingFlow, OnboardingStep[]> = {
  create: ['rythme', 'livre', 'page', 'objectif', 'inviter', 'notifications', 'prepa', 'carte'],
  join: ['rythme', 'page', 'notifications', 'prepa', 'carte'],
  add: ['livre', 'page', 'objectif', 'inviter', 'prepa', 'carte'],
  addJoin: ['page', 'prepa', 'carte'],
};

/** Les écrans à questions, ceux qui portent le fil de progression */
const ASKING: OnboardingStep[] = ['rythme', 'livre', 'page', 'objectif', 'inviter', 'notifications'];

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
 * brouillon vierge, puis « Quel livre ? » — ou le code, pour rejoindre.
 */
export function startAdding(join = false): `/onboarding/${OnboardingStep}` {
  useOnboardingStore.getState().begin(join ? 'addJoin' : 'add');
  return join ? '/onboarding/code' : firstStep('add');
}
