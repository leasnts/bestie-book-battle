/**
 * Les emojis des réactions du carnet.
 *
 * - `QUICK_REACTIONS` : les six qui s'ouvrent sous une note, ceux d'un club de
 *   lecture (pleurer, fondre, rire, brûler, crier, guetter la suite).
 * - `EMOJI_SECTIONS` : le sélecteur complet. Une sélection plutôt que les 3 600
 *   emojis d'Unicode : ce qu'on dit d'une page tient en quelques familles, et
 *   une grille courte se parcourt sans chercher.
 */

export const QUICK_REACTIONS = ['😭', '🫶', '😂', '🔥', '😱', '👀'];

export interface EmojiSection {
  title: string;
  emojis: string[];
}

export const EMOJI_SECTIONS: EmojiSection[] = [
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
