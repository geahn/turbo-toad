export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  /** gradient stops for the avatar */
  color: string;
  color2: string;
  /** ink-on-color or white-on-color glyph readability */
  dark?: boolean;
}

export const CHARACTERS: CharacterDef[] = [
  { id: "mario", name: "Mario", emoji: "🍄", color: "#e11d2a", color2: "#ff5a63" },
  { id: "luigi", name: "Luigi", emoji: "🌱", color: "#2f9e44", color2: "#69db7c" },
  { id: "peach", name: "Peach", emoji: "👑", color: "#f06595", color2: "#ffc9de" },
  { id: "daisy", name: "Daisy", emoji: "🌼", color: "#f59f00", color2: "#ffe066" },
  { id: "rosalina", name: "Rosalina", emoji: "⭐", color: "#4dabf7", color2: "#d0ebff", dark: true },
  { id: "yoshi", name: "Yoshi", emoji: "🦕", color: "#40c057", color2: "#b2f2bb" },
  { id: "shyguy", name: "Shy Guy", emoji: "🎭", color: "#c92a2a", color2: "#ff8787" },
  { id: "toadette", name: "Toadette", emoji: "🍄", color: "#e64980", color2: "#fcc2d7" },
  { id: "bowser", name: "Bowser", emoji: "🐲", color: "#f76707", color2: "#ffd43b" },
  { id: "dk", name: "Donkey Kong", emoji: "🦍", color: "#8c5a2b", color2: "#d9a56b" },
  { id: "bowserjr", name: "Bowser Jr", emoji: "🔥", color: "#74b816", color2: "#c0eb75" },
  { id: "link", name: "Link", emoji: "🗡️", color: "#2b8a3e", color2: "#8ce99a" },
];

export const characterById = (id: string): CharacterDef =>
  CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
