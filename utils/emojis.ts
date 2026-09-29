/**
 * Les emojis des notes et des réactions du carnet de notes.
 *
 * - `TRENDING_EMOJIS` : la courte liste, **la même partout** où l'on en propose
 *   une (barre de Ma page, éditeur de note, réactions). Ceux qui dominent les
 *   usages en 2026 (😭 🥹 💀 🔥 😂 : classements BestEmojis, Emojipedia, Gen Z),
 *   gardés s'ils disent quelque chose d'une page qu'on lit (Lea, 2026-09-29).
 * - `QUICK_REACTIONS` : les six premiers, sous une note.
 * - `EMOJI_SECTIONS` : le sélecteur complet, la liste à la mode en tête. Une
 *   sélection plutôt que les 3 600 emojis d'Unicode : ce qu'on dit d'une page
 *   tient en quelques familles, et une grille courte se parcourt sans chercher.
 */

export const TRENDING_EMOJIS = ['😭', '🥹', '💀', '🔥', '😂', '🫶', '🫠', '👀', '😱', '❤️', '✨', '🙏'];

export const QUICK_REACTIONS = TRENDING_EMOJIS.slice(0, 6);

export interface EmojiSection {
  title: string;
  emojis: string[];
}

export const EMOJI_SECTIONS: EmojiSection[] = [
  { title: 'À la mode', emojis: TRENDING_EMOJIS },
  {
    title: 'Visages',
    emojis: [
      '😭', '😂', '🤣', '🥹', '🥺', '😍', '🥰', '😘', '🤩', '😊', '🙂', '🙃', '😉', '😇',
      '😅', '😆', '😁', '😄', '🫠', '😌', '😏', '😒', '🙄', '😬', '😮‍💨', '🤭', '🫢', '🫣',
      '🤫', '🤔', '🧐', '🤨', '😐', '😑', '😶', '🫥', '😳', '😱', '😨', '😰', '😥', '😢',
      '😞', '😔', '😟', '😕', '🫤', '😮', '😯', '😲', '🤯', '😵', '😵‍💫', '🥴', '😴', '🥱',
      '😤', '😠', '😡', '🤬', '🤢', '🤮', '🥵', '🥶', '😈', '💀', '☠️', '🤡', '👻', '🤓',
      '😎', '🥳', '🤗', '🤐', '🙈', '🙉', '🙊',
    ],
  },
  {
    title: 'Cœurs',
    emojis: [
      '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶', '🤍', '💔', '❤️‍🔥',
      '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💌',
    ],
  },
  {
    title: 'Mains',
    emojis: [
      '🫶', '👏', '🙌', '🙏', '👍', '👎', '🤝', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '💪',
      '👋', '🫡', '✍️', '💅', '👀',
    ],
  },
  {
    title: 'Lecture',
    emojis: [
      '📖', '📚', '🔖', '📌', '📝', '✏️', '🕯️', '☕', '🍵', '🍷', '🥂', '🍿', '🍫', '🌙',
      '⭐', '✨', '💫', '🔥', '💥', '⚡', '💧', '🌧️', '🌹', '🥀', '🌸', '🦋', '🐉', '🗡️',
      '⚔️', '🏰', '👑', '💍', '🔮', '🪄', '🎭', '🕰️',
    ],
  },
  {
    title: 'Symboles',
    emojis: ['💯', '‼️', '⁉️', '❓', '❗', '💢', '💤', '🚩', '✅', '❌', '🆘', '🔞'],
  },
];
