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
 * « Bienvenue » : elle n'est pas dans les listes, useAfterLogin y renvoie.
 * En créant, la fin se joue sur « Invite tes potes » : la carte se retourne
 * et s'écrit (utils/finishOnboarding) ; en rejoignant, sur « carte ».
 * Les notifications viennent après la carte, hors du fil de progression :
 * l'onboarding est fini, c'est le seuil de l'accueil (sautées si iOS a déjà
 * sa réponse).
 */

import { useOnboardingStore } from '../stores/onboardingStore';

export type OnboardingFlow = 'create' | 'join' | 'add' | 'addJoin';

export type OnboardingStep =
  | 'bienvenue'
  | 'choix'
  | 'code'
  | 'invitation'
  | 'rythme'
  | 'formats'
  | 'livre'
  | 'total'
  | 'page'
  | 'objectif'
  | 'inviter'
  | 'notifications'
  | 'carte';

const FLOWS: Record<OnboardingFlow, OnboardingStep[]> = {
  create: ['bienvenue', 'rythme', 'formats', 'choix', 'livre', 'page', 'objectif', 'inviter', 'notifications'],
  join: ['bienvenue', 'rythme', 'formats', 'page', 'carte', 'notifications'],
  add: ['choix', 'livre', 'page', 'objectif', 'inviter'],
  addJoin: ['page', 'carte'],
};

/** Les écrans à questions, ceux qui portent le fil de progression */
const ASKING: OnboardingStep[] = ['rythme', 'formats', 'choix', 'livre', 'page', 'objectif'];

/** L'écran qui suit, dans ce parcours */
export function nextStep(flow: OnboardingFlow, step: OnboardingStep): `/onboarding/${OnboardingStep}` {
  const steps = FLOWS[flow];
  const next = steps[steps.indexOf(step) + 1] ?? 'carte';
  return `/onboarding/${next}`;
}

/**
 * Après « On lit quoi ? » : « Combien de pages ? » si personne ne
 * connaît le total de l'édition, sinon la suite du parcours.
 */
export function afterBook(flow: OnboardingFlow, pages: number): `/onboarding/${OnboardingStep}` {
  return pages > 0 ? nextStep(flow, 'livre') : '/onboarding/total';
}

/** Le premier écran après la connexion */
export function firstStep(flow: OnboardingFlow): `/onboarding/${OnboardingStep}` {
  return `/onboarding/${FLOWS[flow][0]}`;
}

/** La question en cours et leur nombre, dans ce parcours ; null hors des questions */
export function stepPosition(flow: OnboardingFlow, step: OnboardingStep): { index: number; total: number } | null {
  // « Combien de pages ? » (seulement sans total connu) : sur le même point que la page
  if (step === 'total') step = 'page';
  if (!ASKING.includes(step)) return null;
  const asked = FLOWS[flow].filter((s) => ASKING.includes(s));
  const index = asked.indexOf(step);
  return index < 0 ? null : { index, total: asked.length };
}

/** Le parcours ajoute un livre à un compte existant : on peut le fermer */
export function isAddFlow(flow: OnboardingFlow) {
  return flow === 'add' || flow === 'addJoin';
}

/**
 * Ajouter un livre depuis l'app (le « + », la bibliothèque, l'accueil vide…) :
 * brouillon vierge, puis « Par où on commence ? » — ou le code directement.
 */
export function startAdding(join = false): `/onboarding/${OnboardingStep}` {
  useOnboardingStore.getState().begin(join ? 'addJoin' : 'add');
  return join ? '/onboarding/code' : firstStep('add');
}
