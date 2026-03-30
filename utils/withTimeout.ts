/**
 * Wrapper qui ajoute un timeout a n'importe quelle Promise.
 *
 * Sur mobile, fetch() n'a pas de timeout par defaut. Si le reseau est
 * instable, une requete Supabase peut pendre indefiniment — l'app reste
 * bloquee sur "Chargement de tes projets..." sans jamais resoudre.
 *
 * @param promise  La promise a executer
 * @param ms       Timeout en millisecondes (defaut: 10 000)
 * @returns        Le resultat de la promise, ou reject si timeout depasse
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 10_000): Promise<T> {
  // Wrap pour pouvoir silencer le rejet tardif si le timeout gagne la race.
  // Sans ça, quand le timeout se déclenche mais que la requête originale finit
  // par échouer aussi, son rejet n'est rattrapé par personne → "Uncaught in promise".
  const wrapped = Promise.resolve(promise);
  wrapped.catch(() => {});

  return Promise.race([
    wrapped,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
